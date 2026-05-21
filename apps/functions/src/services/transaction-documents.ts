import { DEFAULT_CURRENCY } from "@budgetlink/config";
import {
  categorizeOperation,
  detectInternalTransfer,
  normalizeLabel,
  stableTransactionHash,
  type MerchantRule,
  type Transaction
} from "@budgetlink/domain";

import type { ProviderTransactionSnapshot } from "../providers/types";

export const buildTransactionDocument = ({
  userId,
  connectionId,
  accountId,
  providerTransaction,
  merchantRules
}: {
  userId: string;
  connectionId: string;
  accountId: string;
  providerTransaction: ProviderTransactionSnapshot;
  merchantRules: MerchantRule[];
}): Transaction => {
  const categorization = categorizeOperation({
    amount: providerTransaction.amount,
    label: providerTransaction.label,
    merchant: providerTransaction.merchantName,
    providerCategory: providerTransaction.providerCategory,
    rules: merchantRules
  });
  const normalizedLabel = normalizeLabel(providerTransaction.label);
  const dedupeHash = stableTransactionHash([
    accountId,
    providerTransaction.externalId,
    providerTransaction.date,
    `${providerTransaction.amount}`,
    normalizedLabel
  ]);

  return {
    id: providerTransaction.externalId || dedupeHash,
    userId,
    accountId,
    connectionId,
    source: "powens",
    providerTransactionId: providerTransaction.externalId,
    date: providerTransaction.date,
    bookedAt: providerTransaction.bookedAt,
    amount: providerTransaction.amount,
    currency: providerTransaction.currency || DEFAULT_CURRENCY,
    rawLabel: providerTransaction.label,
    normalizedLabel,
    merchantName: categorization.merchantName,
    providerCategory: providerTransaction.providerCategory ?? null,
    categoryId: categorization.categoryId,
    categoryConfidence: categorization.confidence,
    dedupeHash,
    notes: null,
    flags: {
      isInternalTransfer: detectInternalTransfer({
        normalizedLabel,
        categoryId: categorization.categoryId
      }),
      isRecurring: false,
      excludedFromReports: false,
      needsReview: categorization.needsReview,
      userEditedCategory: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const buildCsvTransactionDocument = ({
  userId,
  accountId,
  label,
  amount,
  date,
  merchant,
  providerCategory,
  merchantRules
}: {
  userId: string;
  accountId: string;
  label: string;
  amount: number;
  date: string;
  merchant?: string;
  providerCategory?: string;
  merchantRules: MerchantRule[];
}): Transaction => {
  const categorization = categorizeOperation({
    amount,
    label,
    merchant,
    providerCategory,
    rules: merchantRules
  });
  const normalizedLabel = normalizeLabel(label);
  const dedupeHash = stableTransactionHash([accountId, date, `${amount}`, normalizedLabel, merchant ?? ""]);

  return {
    id: dedupeHash,
    userId,
    accountId,
    connectionId: null,
    source: "csv",
    providerTransactionId: null,
    date,
    bookedAt: date,
    amount,
    currency: DEFAULT_CURRENCY,
    rawLabel: label,
    normalizedLabel,
    merchantName: categorization.merchantName,
    providerCategory: providerCategory ?? null,
    categoryId: categorization.categoryId,
    categoryConfidence: categorization.confidence,
    dedupeHash,
    notes: null,
    flags: {
      isInternalTransfer: detectInternalTransfer({
        normalizedLabel,
        categoryId: categorization.categoryId
      }),
      isRecurring: false,
      excludedFromReports: false,
      needsReview: categorization.needsReview,
      userEditedCategory: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};
