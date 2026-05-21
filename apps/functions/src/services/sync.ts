import { DEFAULT_CURRENCY } from "@budgetlink/config";
import {
  createMonthlySummary,
  toMonthKey,
  type Account,
  type MerchantRule,
  type Transaction
} from "@budgetlink/domain";
import type { WriteBatch } from "firebase-admin/firestore";

import { db } from "../firebase";
import type { ProviderConnectionSnapshot, ProviderTransactionSnapshot } from "../providers/types";
import { buildCsvTransactionDocument, buildTransactionDocument } from "./transaction-documents";

export const syncProviderSnapshotForUser = async ({
  userId,
  connectionId,
  snapshot
}: {
  userId: string;
  connectionId: string;
  snapshot: ProviderConnectionSnapshot;
}) => {
  const merchantRules = await getMerchantRules(userId);
  const now = new Date().toISOString();
  const operations: Array<(batch: WriteBatch) => void> = [];
  const monthKeys = new Set<string>();
  const accountIdByExternalId = new Map<string, string>();

  operations.push((batch) => {
    batch.set(
      db.doc(`users/${userId}/bankConnections/${connectionId}`),
      {
        provider: "powens",
        userId,
        institutionName: snapshot.institutionName,
        externalReference: snapshot.externalReference,
        status: snapshot.status,
        consentExpiresAt: snapshot.consentExpiresAt,
        lastSyncAt: now,
        syncError: null,
        updatedAt: now
      },
      { merge: true }
    );
  });

  for (const account of snapshot.accounts) {
    const accountId = account.externalId;
    accountIdByExternalId.set(account.externalId, accountId);
    operations.push((batch) => {
      batch.set(
        db.doc(`users/${userId}/accounts/${accountId}`),
        {
          id: accountId,
          userId,
          connectionId,
          provider: "powens",
          externalId: account.externalId,
          type: account.type,
          label: account.label,
          maskedIban: account.maskedIban,
          currency: account.currency || DEFAULT_CURRENCY,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          lastUpdatedAt: account.updatedAt
        },
        { merge: true }
      );
    });
  }

  for (const providerTransaction of snapshot.transactions) {
    const accountId = accountIdByExternalId.get(providerTransaction.accountExternalId) ?? providerTransaction.accountExternalId;
    const transaction = buildTransactionDocument({
      userId,
      connectionId,
      accountId,
      providerTransaction,
      merchantRules
    });
    monthKeys.add(toMonthKey(transaction.date));
    operations.push((batch) => {
      batch.set(db.doc(`users/${userId}/transactions/${transaction.id}`), transaction, { merge: true });
    });
  }

  await commitBatchOperations(operations);
  await rebuildMonthlySummaries(userId, [...monthKeys]);
};

export const markConnectionSyncError = async ({
  userId,
  connectionId,
  message
}: {
  userId: string;
  connectionId: string;
  message: string;
}) => {
  await db.doc(`users/${userId}/bankConnections/${connectionId}`).set(
    {
      status: "error",
      syncError: message,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
};

export const rebuildMonthlySummaries = async (userId: string, monthKeys: string[]) => {
  for (const monthKey of monthKeys) {
    const [year, month] = monthKey.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const end = new Date(Date.UTC(year, month, 1)).toISOString();
    const snapshot = await db
      .collection(`users/${userId}/transactions`)
      .where("date", ">=", start)
      .where("date", "<", end)
      .get();
    const transactions = snapshot.docs.map((document: any) => document.data() as Transaction);
    const summary = createMonthlySummary({
      userId,
      month: monthKey,
      transactions
    });

    await db.doc(`users/${userId}/monthlySummaries/${monthKey}`).set(summary, { merge: true });
  }
};

export const ensureCsvAccount = async ({
  userId,
  label,
  currency = DEFAULT_CURRENCY,
  type = "checking",
  currentBalance = 0
}: {
  userId: string;
  label: string;
  currency?: string;
  type?: Account["type"];
  currentBalance?: number;
}) => {
  const accountId = `csv-${slugify(label)}`;
  await db.doc(`users/${userId}/accounts/${accountId}`).set(
    {
      id: accountId,
      userId,
      connectionId: "csv-import",
      provider: "csv",
      externalId: accountId,
      type,
      label,
      maskedIban: null,
      currency,
      currentBalance,
      availableBalance: currentBalance,
      lastUpdatedAt: new Date().toISOString()
    },
    { merge: true }
  );
  return accountId;
};

const getMerchantRules = async (userId: string) => {
  const snapshot = await db.collection(`users/${userId}/merchantRules`).get();
  return snapshot.docs.map((document: any) => document.data() as MerchantRule);
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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
