import type { CsvColumnMapping } from "@budgetlink/domain";
import { httpsCallable } from "firebase/functions";

import { functions } from "./firebase";

export const createBankLinkSession = async (redirectUrl?: string) => {
  const callable = httpsCallable<
    { provider: "powens"; redirectUrl?: string },
    { sessionUrl: string; expiresAt: string }
  >(functions, "createBankLinkSession");
  const result = await callable({ provider: "powens", redirectUrl });
  return result.data;
};

export const runManualSync = async (connectionId?: string) => {
  const callable = httpsCallable<{ connectionId?: string }, { accepted: boolean }>(functions, "runManualSync");
  const result = await callable({ connectionId });
  return result.data;
};

export const disconnectBankConnection = async (connectionId: string) => {
  const callable = httpsCallable<{ connectionId: string }, { success: boolean }>(functions, "disconnectBankConnection");
  const result = await callable({ connectionId });
  return result.data;
};

export const createCsvImportUpload = async (fileName: string) => {
  const callable = httpsCallable<{ fileName: string }, { importId: string; uploadUrl: string }>(
    functions,
    "createCsvImportUpload"
  );
  const result = await callable({ fileName });
  return result.data;
};

export const confirmCsvImport = async (payload: {
  importId: string;
  mapping: CsvColumnMapping;
  accountMeta: { label: string; currency?: string; currentBalance?: number };
}) => {
  const callable = httpsCallable<typeof payload, { accepted: boolean }>(functions, "confirmCsvImport");
  const result = await callable(payload);
  return result.data;
};
