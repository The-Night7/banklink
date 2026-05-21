import type { CreateLinkSessionInput, ProviderConnectionSnapshot, ProviderLinkSession, SyncConnectionInput } from "./types";

export interface BankProvider {
  readonly id: "powens";
  createLinkSession(input: CreateLinkSessionInput): Promise<ProviderLinkSession>;
  syncConnection(input: SyncConnectionInput): Promise<ProviderConnectionSnapshot>;
  disconnectConnection(externalReference: string): Promise<void>;
  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody?: string): boolean;
  extractWebhookReference(payload: unknown): { externalReference: string } | null;
}
