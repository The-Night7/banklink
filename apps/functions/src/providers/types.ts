export type ProviderLinkSession = {
  externalReference: string;
  sessionUrl: string;
  expiresAt: string;
  institutionName?: string;
};

export type ProviderAccountSnapshot = {
  externalId: string;
  type: "checking" | "savings" | "credit" | "loan" | "other";
  label: string;
  maskedIban: string | null;
  currency: string;
  currentBalance: number;
  availableBalance: number | null;
  updatedAt: string;
};

export type ProviderTransactionSnapshot = {
  externalId: string;
  accountExternalId: string;
  bookedAt: string | null;
  date: string;
  amount: number;
  currency: string;
  label: string;
  merchantName?: string;
  providerCategory?: string | null;
};

export type ProviderConnectionSnapshot = {
  externalReference: string;
  institutionName: string;
  consentExpiresAt: string | null;
  status: "connected" | "attention";
  accounts: ProviderAccountSnapshot[];
  transactions: ProviderTransactionSnapshot[];
};

export type CreateLinkSessionInput = {
  userId: string;
  connectionId: string;
  redirectUrl?: string;
};

export type SyncConnectionInput = {
  externalReference: string;
  fromDate?: string | null;
};
