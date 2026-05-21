import type { CategoryId } from "@budgetlink/config";

export type BankProviderId = "powens" | "csv";
export type AccountType = "checking" | "savings" | "credit" | "loan" | "other";
export type TransactionSource = "powens" | "csv" | "manual";
export type BankConnectionStatus =
  | "pending"
  | "connected"
  | "syncing"
  | "attention"
  | "error"
  | "consentExpired"
  | "disconnected";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  locale: string;
  currency: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BankConnection = {
  id: string;
  userId: string;
  provider: BankProviderId;
  institutionName: string;
  status: BankConnectionStatus;
  consentExpiresAt: string | null;
  externalReference: string;
  lastSyncAt: string | null;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Account = {
  id: string;
  userId: string;
  connectionId: string;
  provider: BankProviderId;
  externalId: string;
  type: AccountType;
  label: string;
  maskedIban: string | null;
  currency: string;
  currentBalance: number;
  availableBalance: number | null;
  lastUpdatedAt: string;
};

export type TransactionFlags = {
  isInternalTransfer: boolean;
  isRecurring: boolean;
  excludedFromReports: boolean;
  needsReview: boolean;
  userEditedCategory: boolean;
};

export type Transaction = {
  id: string;
  userId: string;
  accountId: string;
  connectionId: string | null;
  source: TransactionSource;
  providerTransactionId: string | null;
  date: string;
  bookedAt: string | null;
  amount: number;
  currency: string;
  rawLabel: string;
  normalizedLabel: string;
  merchantName: string;
  providerCategory: string | null;
  categoryId: CategoryId;
  categoryConfidence: number;
  dedupeHash: string;
  notes: string | null;
  flags: TransactionFlags;
  createdAt: string;
  updatedAt: string;
};

export type MerchantRule = {
  id: string;
  userId: string;
  pattern: string;
  categoryId: CategoryId;
  priority: number;
  createdAt: string;
  source: "manual" | "auto";
};

export type Budget = {
  id: string;
  userId: string;
  month: string;
  categoryId: CategoryId;
  limitAmount: number;
  warningThreshold: number;
  dangerThreshold: number;
  createdAt: string;
  updatedAt: string;
};

export type GoalAccountAllocation = {
  accountId: string;
  weight: number;
};

export type SavingsGoal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  accountAllocations: GoalAccountAllocation[];
  createdAt: string;
  updatedAt: string;
};

export type MonthlySummary = {
  id: string;
  userId: string;
  month: string;
  income: number;
  expenses: number;
  netSavings: number;
  categoryTotals: Partial<Record<CategoryId, number>>;
  transactionsCount: number;
  generatedAt: string;
};

export type CsvImportStatus = "pending" | "uploaded" | "processing" | "completed" | "failed";

export type CsvImport = {
  id: string;
  userId: string;
  fileName: string;
  status: CsvImportStatus;
  rowCount: number;
  importedCount: number;
  errors: string[];
  createdAt: string;
  updatedAt: string;
};

export type CsvColumnMapping = {
  date: string;
  amount: string;
  label: string;
  merchant?: string;
  accountLabel?: string;
  category?: string;
};

export type ParsedCsvRow = {
  date: string;
  amount: number;
  label: string;
  merchant?: string;
  category?: string;
};

export type BudgetProgress = Budget & {
  spent: number;
  remaining: number;
  ratio: number;
  severity: "ok" | "warning" | "danger";
};

export type GoalProgress = SavingsGoal & {
  completionRatio: number;
  projectedMonthlySavings: number;
  projectedCompletionDate: string | null;
};
