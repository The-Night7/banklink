import { parse } from "csv-parse/sync";

import { parseCsvRow, toMonthKey, type CsvColumnMapping } from "@budgetlink/domain";
import type { WriteBatch } from "firebase-admin/firestore";

import { storage, db } from "../firebase";
import { buildCsvTransactionDocument } from "./transaction-documents";
import { ensureCsvAccount, rebuildMonthlySummaries } from "./sync";

export const createCsvImportUploadUrl = async ({
  userId,
  fileName
}: {
  userId: string;
  fileName: string;
}) => {
  const importId = crypto.randomUUID();
  const objectPath = `users/${userId}/imports/${importId}/${fileName || "transactions.csv"}`;
  const file = storage.bucket().file(objectPath);
  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: "text/csv"
  });

  await db.doc(`users/${userId}/imports/${importId}`).set({
    id: importId,
    userId,
    fileName,
    status: "uploaded",
    rowCount: 0,
    importedCount: 0,
    errors: [],
    storagePath: objectPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return { importId, uploadUrl };
};

export const processCsvImport = async ({
  userId,
  importId,
  mapping,
  accountMeta
}: {
  userId: string;
  importId: string;
  mapping: CsvColumnMapping;
  accountMeta: { label: string; currency?: string; currentBalance?: number };
}) => {
  const importRef = db.doc(`users/${userId}/imports/${importId}`);
  const importDocument = await importRef.get();
  const importData = importDocument.data();

  if (!importData?.storagePath) {
    throw new Error("CSV import file not found");
  }

  await importRef.set(
    {
      status: "processing",
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  const file = storage.bucket().file(importData.storagePath);
  const [buffer] = await file.download();
  const rows = parse(buffer.toString("utf-8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true
  }) as Record<string, string>[];
  const accountId = await ensureCsvAccount({
    userId,
    label: accountMeta.label,
    currency: accountMeta.currency,
    currentBalance: accountMeta.currentBalance
  });
  const merchantRules = await loadMerchantRules(userId);
  const monthKeys = new Set<string>();
  const operations: Array<(batch: WriteBatch) => void> = [];

  for (const row of rows) {
    const parsed = parseCsvRow(row, mapping);
    const transaction = buildCsvTransactionDocument({
      userId,
      accountId,
      label: parsed.label,
      amount: parsed.amount,
      date: parsed.date,
      merchant: parsed.merchant,
      providerCategory: parsed.category,
      merchantRules
    });
    monthKeys.add(toMonthKey(transaction.date));
    operations.push((batch) => {
      batch.set(db.doc(`users/${userId}/transactions/${transaction.id}`), transaction, { merge: true });
    });
  }

  await commitBatchOperations(operations);
  await rebuildMonthlySummaries(userId, [...monthKeys]);
  await importRef.set(
    {
      status: "completed",
      rowCount: rows.length,
      importedCount: rows.length,
      errors: [],
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return { importedCount: rows.length };
};

const loadMerchantRules = async (userId: string) => {
  const snapshot = await db.collection(`users/${userId}/merchantRules`).get();
  return snapshot.docs.map((document: any) => document.data());
};

const commitBatchOperations = async (operations: Array<(batch: WriteBatch) => void>) => {
  const chunkSize = 400;
  for (let index = 0; index < operations.length; index += chunkSize) {
    const batch = db.batch();
    for (const operation of operations.slice(index, index + chunkSize)) {
      operation(batch);
    }
    await batch.commit();
  }
};
