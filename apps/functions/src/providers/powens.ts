import { readServerEnv } from "@budgetlink/config";

import type { BankProvider } from "./bank-provider";
import type {
  CreateLinkSessionInput,
  ProviderAccountSnapshot,
  ProviderConnectionSnapshot,
  ProviderLinkSession,
  ProviderTransactionSnapshot,
  SyncConnectionInput
} from "./types";

type PowensApiClientOptions = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  webhookSecret: string;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

type UnknownRecord = Record<string, unknown>;

export class PowensProvider implements BankProvider {
  readonly id = "powens" as const;

  private accessToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly options: PowensApiClientOptions) {}

  static fromEnv(env: Record<string, string | undefined>) {
    const parsed = readServerEnv(env);
    return new PowensProvider({
      clientId: parsed.POWENS_CLIENT_ID,
      clientSecret: parsed.POWENS_CLIENT_SECRET,
      baseUrl: parsed.POWENS_BASE_URL,
      webhookSecret: parsed.POWENS_WEBHOOK_SECRET
    });
  }

  async createLinkSession(input: CreateLinkSessionInput): Promise<ProviderLinkSession> {
    const response = await this.request<UnknownRecord>("/v2/connect/sessions", {
      method: "POST",
      body: JSON.stringify({
        customer_reference: input.userId,
        connection_reference: input.connectionId,
        redirect_url: input.redirectUrl
      })
    });

    return {
      externalReference: stringValue(response.connection_id) ?? stringValue(response.id) ?? input.connectionId,
      sessionUrl: stringValue(response.session_url) ?? stringValue(response.url) ?? "",
      expiresAt:
        stringValue(response.expires_at) ??
        new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      institutionName: stringValue(response.institution_name) ?? "Powens"
    };
  }

  async syncConnection(input: SyncConnectionInput): Promise<ProviderConnectionSnapshot> {
    const connection = await this.request<UnknownRecord>(`/v2/connections/${input.externalReference}`);
    const accountsResponse = await this.request<UnknownRecord | UnknownRecord[]>(
      `/v2/connections/${input.externalReference}/accounts`
    );
    const accountsPayload = arrayValue("accounts", accountsResponse);
    const accounts = accountsPayload.map(mapAccountPayload);

    const transactionGroups = await Promise.all(
      accounts.map(async (account) => {
        const url = input.fromDate
          ? `/v2/accounts/${account.externalId}/transactions?from=${encodeURIComponent(input.fromDate)}`
          : `/v2/accounts/${account.externalId}/transactions`;
        const transactionResponse = await this.request<UnknownRecord | UnknownRecord[]>(url);
        const transactionsPayload = arrayValue("transactions", transactionResponse);
        return transactionsPayload.map((transaction) => mapTransactionPayload(transaction, account.externalId));
      })
    );

    return {
      externalReference: input.externalReference,
      institutionName: stringValue(connection.institution_name) ?? "Banque connectee",
      consentExpiresAt: stringValue(connection.consent_expires_at) ?? null,
      status: stringValue(connection.status) === "attention" ? "attention" : "connected",
      accounts,
      transactions: transactionGroups.flat()
    };
  }

  async disconnectConnection(externalReference: string) {
    await this.request(`/v2/connections/${externalReference}`, {
      method: "DELETE"
    });
  }

  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, _rawBody?: string) {
    const signature = firstHeader(headers["x-powens-webhook-secret"] ?? headers["x-webhook-secret"]);
    return signature === this.options.webhookSecret;
  }

  extractWebhookReference(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const record = payload as UnknownRecord;
    const externalReference =
      stringValue(record.connection_id) ??
      stringValue(record.connection_reference) ??
      stringValue(record.id);

    return externalReference ? { externalReference } : null;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      throw new Error(`Powens request failed (${response.status}) on ${path}`);
    }

    return (await response.json()) as T;
  }

  private async getAccessToken() {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 30_000) {
      return this.accessToken.value;
    }

    const response = await fetch(`${this.options.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret
      }).toString()
    });

    if (!response.ok) {
      throw new Error(`Powens auth failed (${response.status})`);
    }

    const token = (await response.json()) as TokenResponse;
    this.accessToken = {
      value: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000
    };

    return token.access_token;
  }
}

const mapAccountPayload = (payload: UnknownRecord): ProviderAccountSnapshot => ({
  externalId: stringValue(payload.id) ?? stringValue(payload.account_id) ?? crypto.randomUUID(),
  type: mapAccountType(stringValue(payload.type)),
  label: stringValue(payload.label) ?? stringValue(payload.name) ?? "Compte",
  maskedIban: stringValue(payload.iban) ?? stringValue(payload.masked_iban) ?? null,
  currency: stringValue(payload.currency) ?? "EUR",
  currentBalance: numberValue(payload.balance) ?? numberValue(payload.current_balance) ?? 0,
  availableBalance:
    numberValue(payload.available_balance) ?? numberValue(payload.balance_available) ?? null,
  updatedAt: stringValue(payload.updated_at) ?? new Date().toISOString()
});

const mapTransactionPayload = (
  payload: UnknownRecord,
  accountExternalId: string
): ProviderTransactionSnapshot => ({
  externalId: stringValue(payload.id) ?? stringValue(payload.transaction_id) ?? crypto.randomUUID(),
  accountExternalId,
  bookedAt: stringValue(payload.booked_at) ?? stringValue(payload.date) ?? null,
  date: stringValue(payload.date) ?? new Date().toISOString(),
  amount: numberValue(payload.amount) ?? 0,
  currency: stringValue(payload.currency) ?? "EUR",
  label: stringValue(payload.label) ?? stringValue(payload.raw_label) ?? "Operation",
  merchantName: stringValue(payload.merchant_name) ?? stringValue(payload.merchant) ?? undefined,
  providerCategory: stringValue(payload.category) ?? stringValue(payload.category_name) ?? undefined
});

const mapAccountType = (value?: string | null): ProviderAccountSnapshot["type"] => {
  if (!value) {
    return "other";
  }

  if (value.includes("checking") || value.includes("current")) {
    return "checking";
  }

  if (value.includes("saving")) {
    return "savings";
  }

  if (value.includes("credit")) {
    return "credit";
  }

  if (value.includes("loan")) {
    return "loan";
  }

  return "other";
};

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const numberValue = (value: unknown) => (typeof value === "number" ? value : typeof value === "string" ? Number(value) : null);

const arrayValue = (field: string, value: UnknownRecord | UnknownRecord[]) => {
  if (Array.isArray(value)) {
    return value as UnknownRecord[];
  }

  const nested = value[field];
  return Array.isArray(nested) ? (nested as UnknownRecord[]) : [];
};

const firstHeader = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
