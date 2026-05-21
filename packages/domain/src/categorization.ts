import { CATEGORY_BY_ID, CATEGORY_DEFINITIONS, type CategoryId } from "@budgetlink/config";

import type { MerchantRule, ParsedCsvRow, Transaction } from "./types";

const POWENS_CATEGORY_MAP: Record<string, CategoryId> = {
  housing: "housing",
  food: "food",
  groceries: "food",
  restaurants: "food",
  transport: "transport",
  health: "health",
  leisure: "leisure",
  subscriptions: "subscriptions",
  shopping: "shopping",
  fees: "feesTaxes",
  taxes: "feesTaxes",
  salary: "income",
  income: "income",
  savings: "savings",
  transfer: "transfers"
};

export const normalizeLabel = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeMerchantName = (value: string) => {
  const cleaned = normalizeLabel(value);
  return cleaned
    .replace(/\b(cb|carte|paiement|sepa|prlv|virement|vir)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const mapPowensCategory = (providerCategory?: string | null): CategoryId | null => {
  if (!providerCategory) {
    return null;
  }

  const normalized = normalizeLabel(providerCategory).replace(/\s/g, "");
  return POWENS_CATEGORY_MAP[normalized] ?? null;
};

const findKeywordCategory = (label: string): CategoryId | null => {
  for (const category of CATEGORY_DEFINITIONS) {
    if (category.keywords.some((keyword) => label.includes(normalizeLabel(keyword)))) {
      return category.id;
    }
  }

  return null;
};

const applyMerchantRules = (merchant: string, rules: MerchantRule[]): CategoryId | null => {
  for (const rule of [...rules].sort((left, right) => right.priority - left.priority)) {
    const pattern = normalizeLabel(rule.pattern);
    if (merchant.includes(pattern)) {
      return rule.categoryId;
    }
  }

  return null;
};

export const categorizeOperation = ({
  amount,
  label,
  merchant,
  providerCategory,
  rules = []
}: {
  amount: number;
  label: string;
  merchant?: string;
  providerCategory?: string | null;
  rules?: MerchantRule[];
}): { categoryId: CategoryId; confidence: number; merchantName: string; needsReview: boolean } => {
  const normalizedLabel = normalizeLabel(label);
  const merchantName = normalizeMerchantName(merchant || label);
  const ruleCategory = applyMerchantRules(merchantName, rules);

  if (ruleCategory) {
    return {
      categoryId: ruleCategory,
      confidence: 0.95,
      merchantName,
      needsReview: false
    };
  }

  const mappedProvider = mapPowensCategory(providerCategory);
  if (mappedProvider) {
    return {
      categoryId: mappedProvider,
      confidence: 0.82,
      merchantName,
      needsReview: false
    };
  }

  if (amount > 0) {
    return {
      categoryId: "income",
      confidence: 0.88,
      merchantName,
      needsReview: false
    };
  }

  const keywordCategory = findKeywordCategory(normalizedLabel);
  if (keywordCategory) {
    return {
      categoryId: keywordCategory,
      confidence: 0.68,
      merchantName,
      needsReview: false
    };
  }

  return {
    categoryId: "other",
    confidence: 0.3,
    merchantName,
    needsReview: true
  };
};

export const buildMerchantRuleFromTransaction = (transaction: Transaction): MerchantRule => ({
  id: `${transaction.userId}:${transaction.merchantName}:${transaction.categoryId}`,
  userId: transaction.userId,
  pattern: transaction.merchantName,
  categoryId: transaction.categoryId,
  priority: 100,
  createdAt: transaction.updatedAt,
  source: "manual"
});

export const categoryLabel = (categoryId: CategoryId) => CATEGORY_BY_ID[categoryId].label;

export const buildCsvCategorizationInput = (row: ParsedCsvRow) => ({
  amount: row.amount,
  label: row.label,
  merchant: row.merchant,
  providerCategory: row.category
});
