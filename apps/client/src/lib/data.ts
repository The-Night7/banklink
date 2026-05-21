import { CATEGORY_IDS, DEFAULT_CURRENCY } from "@budgetlink/config";
import {
  createMonthlySummary,
  type Budget,
  type CategoryId,
  type SavingsGoal,
  type Transaction
} from "@budgetlink/domain";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";

import { firestore } from "./firebase";

export const createBudget = async ({
  userId,
  month,
  categoryId,
  limitAmount
}: {
  userId: string;
  month: string;
  categoryId: CategoryId;
  limitAmount: number;
}) => {
  if (!CATEGORY_IDS.includes(categoryId)) {
    throw new Error("Unknown category");
  }

  const budgetId = `${month}:${categoryId}`;
  const now = new Date().toISOString();
  const budget: Budget = {
    id: budgetId,
    userId,
    month,
    categoryId,
    limitAmount,
    warningThreshold: 0.7,
    dangerThreshold: 0.9,
    createdAt: now,
    updatedAt: now
  };

  await setDoc(doc(firestore, `users/${userId}/budgets/${budgetId}`), budget, { merge: true });
};

export const createGoal = async ({
  userId,
  name,
  targetAmount,
  targetDate
}: {
  userId: string;
  name: string;
  targetAmount: number;
  targetDate?: string;
}) => {
  const goalId = crypto.randomUUID();
  const now = new Date().toISOString();
  const goal: SavingsGoal = {
    id: goalId,
    userId,
    name,
    targetAmount,
    currentAmount: 0,
    targetDate: targetDate || null,
    accountAllocations: [],
    createdAt: now,
    updatedAt: now
  };

  await setDoc(doc(firestore, `users/${userId}/goals/${goalId}`), goal);
};

export const updateTransactionCategory = async ({
  userId,
  transaction,
  categoryId,
  createRule = true
}: {
  userId: string;
  transaction: Transaction;
  categoryId: CategoryId;
  createRule?: boolean;
}) => {
  await updateDoc(doc(firestore, `users/${userId}/transactions/${transaction.id}`), {
    categoryId,
    categoryConfidence: 1,
    "flags.userEditedCategory": true,
    "flags.needsReview": false,
    updatedAt: new Date().toISOString()
  });

  if (createRule && transaction.merchantName) {
    const ruleId = `${transaction.merchantName}:${categoryId}`;
    await setDoc(
      doc(firestore, `users/${userId}/merchantRules/${ruleId}`),
      {
        id: ruleId,
        userId,
        pattern: transaction.merchantName,
        categoryId,
        priority: 100,
        createdAt: new Date().toISOString(),
        source: "manual"
      },
      { merge: true }
    );
  }

  await recomputeMonthlySummary({ userId, month: transaction.date.slice(0, 7) });
};

export const recomputeMonthlySummary = async ({
  userId,
  month
}: {
  userId: string;
  month: string;
}) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString();
  const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString();
  const snapshot = await getDocs(
    query(
      collection(firestore, `users/${userId}/transactions`),
      where("date", ">=", start),
      where("date", "<", end),
      orderBy("date", "desc")
    )
  );
  const transactions = snapshot.docs.map((item: any) => item.data() as Transaction);
  const summary = createMonthlySummary({
    userId,
    month,
    transactions
  });
  await setDoc(doc(firestore, `users/${userId}/monthlySummaries/${month}`), summary, { merge: true });
};

export const importCsvWithStandardHeaders = async ({
  file,
  userId,
  createCsvImportUpload,
  confirmCsvImport
}: {
  file: File;
  userId: string;
  createCsvImportUpload: (fileName: string) => Promise<{ importId: string; uploadUrl: string }>;
  confirmCsvImport: (payload: {
    importId: string;
    mapping: {
      date: string;
      amount: string;
      label: string;
      merchant?: string;
      category?: string;
      accountLabel?: string;
    };
    accountMeta: { label: string; currency?: string; currentBalance?: number };
  }) => Promise<unknown>;
}) => {
  const { importId, uploadUrl } = await createCsvImportUpload(file.name);
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": "text/csv"
    }
  });
  await confirmCsvImport({
    importId,
    mapping: {
      date: "date",
      amount: "amount",
      label: "label",
      merchant: "merchant",
      category: "category",
      accountLabel: "account"
    },
    accountMeta: {
      label: "Import CSV",
      currency: DEFAULT_CURRENCY
    }
  });

  await recomputeAllSummaries(userId);
};

export const recomputeAllSummaries = async (userId: string) => {
  const snapshot = await getDocs(query(collection(firestore, `users/${userId}/transactions`), orderBy("date", "desc")));
  const transactions = snapshot.docs.map((item: any) => item.data() as Transaction);
  const months = Array.from(
    new Set<string>(transactions.map((transaction: Transaction) => transaction.date.slice(0, 7)))
  );

  for (const month of months) {
    const summary = createMonthlySummary({
      userId,
      month,
      transactions
    });
    await setDoc(doc(firestore, `users/${userId}/monthlySummaries/${month}`), summary, { merge: true });
  }
};
