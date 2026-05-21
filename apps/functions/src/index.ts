import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { readServerEnv } from "@budgetlink/config";

import { db } from "./firebase";
import { PowensProvider } from "./providers/powens";
import { createCsvImportUploadUrl, processCsvImport } from "./services/imports";
import { markConnectionSyncError, syncProviderSnapshotForUser } from "./services/sync";

const POWENS_CLIENT_ID = defineSecret("POWENS_CLIENT_ID");
const POWENS_CLIENT_SECRET = defineSecret("POWENS_CLIENT_SECRET");
const POWENS_BASE_URL = defineSecret("POWENS_BASE_URL");
const POWENS_WEBHOOK_SECRET = defineSecret("POWENS_WEBHOOK_SECRET");
const serverEnv = readServerEnv({
  POWENS_CLIENT_ID: "configured-at-runtime",
  POWENS_CLIENT_SECRET: "configured-at-runtime",
  POWENS_BASE_URL: "https://example.invalid",
  POWENS_WEBHOOK_SECRET: "configured-at-runtime",
  SENTRY_DSN: process.env.SENTRY_DSN,
  FIREBASE_ENFORCE_APP_CHECK: process.env.FIREBASE_ENFORCE_APP_CHECK
});

const secureCallableOptions = {
  region: "europe-west1",
  ...(serverEnv.FIREBASE_ENFORCE_APP_CHECK ? { enforceAppCheck: true } : {}),
  secrets: [POWENS_CLIENT_ID, POWENS_CLIENT_SECRET, POWENS_BASE_URL, POWENS_WEBHOOK_SECRET]
} as const;

export const createBankLinkSession = onCall(secureCallableOptions, async (request: any) => {
  const auth = requireAuth(request.auth);
  const input = parseCreateBankLinkSessionInput(request.data);
  const provider = getPowensProvider();
  const connectionId = crypto.randomUUID();

  await db.doc(`users/${auth.uid}/bankConnections/${connectionId}`).set({
    id: connectionId,
    userId: auth.uid,
    provider: input.provider,
    institutionName: "Connexion en preparation",
    status: "pending",
    consentExpiresAt: null,
    externalReference: connectionId,
    lastSyncAt: null,
    syncError: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  try {
    const session = await provider.createLinkSession({
      userId: auth.uid,
      connectionId,
      redirectUrl: input.redirectUrl
    });

    if (!session.sessionUrl) {
      throw new Error("Powens did not return a session URL");
    }

    await db.doc(`users/${auth.uid}/bankConnections/${connectionId}`).set(
      {
        externalReference: session.externalReference,
        institutionName: session.institutionName ?? "Powens",
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return {
      sessionUrl: session.sessionUrl,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Powens session error";
    await db.doc(`users/${auth.uid}/bankConnections/${connectionId}`).set(
      {
        status: "error",
        syncError: message,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    logger.error("Create bank link session failed", { connectionId, userId: auth.uid, error });
    throw new HttpsError("internal", "Connexion Powens impossible. Verifie les secrets et l'URL de base Powens.");
  }
});

export const runManualSync = onCall(secureCallableOptions, async (request: any) => {
  const auth = requireAuth(request.auth);
  const input = parseManualSyncInput(request.data ?? {});
  const provider = getPowensProvider();
  const connections = input.connectionId
    ? [await requireConnection(auth.uid, input.connectionId)]
    : await listActiveConnections(auth.uid);

  for (const connection of connections) {
    try {
      const snapshot = await provider.syncConnection({
        externalReference: connection.externalReference,
        fromDate: connection.lastSyncAt
      });
      await syncProviderSnapshotForUser({
        userId: auth.uid,
        connectionId: connection.id,
        snapshot
      });
    } catch (error) {
      logger.error("Manual sync failed", { connectionId: connection.id, error });
      await markConnectionSyncError({
        userId: auth.uid,
        connectionId: connection.id,
        message: error instanceof Error ? error.message : "Unknown sync error"
      });
    }
  }

  return { accepted: true };
});

export const disconnectBankConnection = onCall(secureCallableOptions, async (request: any) => {
  const auth = requireAuth(request.auth);
  const input = parseDisconnectInput(request.data);
  const provider = getPowensProvider();
  const connection = await requireConnection(auth.uid, input.connectionId);

  await provider.disconnectConnection(connection.externalReference);
  await db.doc(`users/${auth.uid}/bankConnections/${input.connectionId}`).set(
    {
      status: "disconnected",
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return { success: true };
});

export const createCsvImportUpload = onCall(secureCallableOptions, async (request: any) => {
  const auth = requireAuth(request.auth);
  const input = parseCreateCsvUploadInput(request.data ?? {});
  return createCsvImportUploadUrl({
    userId: auth.uid,
    fileName: input.fileName
  });
});

export const confirmCsvImport = onCall(secureCallableOptions, async (request: any) => {
  const auth = requireAuth(request.auth);
  const input = parseConfirmCsvImportInput(request.data);
  await processCsvImport({
    userId: auth.uid,
    importId: input.importId,
    mapping: input.mapping,
    accountMeta: input.accountMeta
  });
  return { accepted: true };
});

export const powensWebhook = onRequest(
  {
    region: "europe-west1",
    secrets: [POWENS_CLIENT_ID, POWENS_CLIENT_SECRET, POWENS_BASE_URL, POWENS_WEBHOOK_SECRET]
  },
  async (request: any, response: any) => {
    const provider = getPowensProvider();
    const rawBody = request.rawBody?.toString("utf-8") ?? "";

    if (!provider.verifyWebhookSignature(request.headers, rawBody)) {
      response.status(401).send("Invalid signature");
      return;
    }

    const reference = provider.extractWebhookReference(request.body);
    if (!reference) {
      response.status(202).send("Ignored");
      return;
    }

    const connection = await findConnectionByExternalReference(reference.externalReference);
    if (!connection) {
      response.status(202).send("Unknown connection");
      return;
    }

    try {
      const snapshot = await provider.syncConnection({
        externalReference: connection.externalReference,
        fromDate: connection.lastSyncAt
      });
      await syncProviderSnapshotForUser({
        userId: connection.userId,
        connectionId: connection.id,
        snapshot
      });
      response.status(200).send("ok");
    } catch (error) {
      logger.error("Powens webhook sync failed", { connectionId: connection.id, error });
      await markConnectionSyncError({
        userId: connection.userId,
        connectionId: connection.id,
        message: error instanceof Error ? error.message : "Unknown webhook error"
      });
      response.status(500).send("error");
    }
  }
);

export const scheduledDailySync = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Paris",
    region: "europe-west1",
    secrets: [POWENS_CLIENT_ID, POWENS_CLIENT_SECRET, POWENS_BASE_URL, POWENS_WEBHOOK_SECRET]
  },
  async () => {
    const provider = getPowensProvider();
    const snapshot = await db.collectionGroup("bankConnections").where("status", "in", ["connected", "attention"]).get();

    for (const document of snapshot.docs) {
      const connection = document.data() as ConnectionRecord;
      try {
        const providerSnapshot = await provider.syncConnection({
          externalReference: connection.externalReference,
          fromDate: connection.lastSyncAt
        });
        await syncProviderSnapshotForUser({
          userId: connection.userId,
          connectionId: connection.id,
          snapshot: providerSnapshot
        });
      } catch (error) {
        logger.error("Scheduled sync failed", { connectionId: connection.id, error });
        await markConnectionSyncError({
          userId: connection.userId,
          connectionId: connection.id,
          message: error instanceof Error ? error.message : "Unknown scheduled sync error"
        });
      }
    }
  }
);

type AuthContext = {
  uid: string;
};

type ConnectionRecord = {
  id: string;
  userId: string;
  externalReference: string;
  lastSyncAt: string | null;
};

const requireAuth = (auth: { uid?: string } | null | undefined): AuthContext => {
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  return { uid: auth.uid };
};

const getPowensProvider = () =>
  PowensProvider.fromEnv({
    POWENS_CLIENT_ID: POWENS_CLIENT_ID.value(),
    POWENS_CLIENT_SECRET: POWENS_CLIENT_SECRET.value(),
    POWENS_BASE_URL: POWENS_BASE_URL.value(),
    POWENS_WEBHOOK_SECRET: POWENS_WEBHOOK_SECRET.value(),
    SENTRY_DSN: ""
  });

const requireConnection = async (userId: string, connectionId: string) => {
  const document = await db.doc(`users/${userId}/bankConnections/${connectionId}`).get();
  const connection = document.data() as ConnectionRecord | undefined;

  if (!connection) {
    throw new HttpsError("not-found", "Connection not found");
  }

  return connection;
};

const listActiveConnections = async (userId: string) => {
  const snapshot = await db
    .collection(`users/${userId}/bankConnections`)
    .where("status", "in", ["connected", "attention", "pending"])
    .get();
  return snapshot.docs.map((document: any) => document.data() as ConnectionRecord);
};

const findConnectionByExternalReference = async (externalReference: string) => {
  const snapshot = await db.collectionGroup("bankConnections").where("externalReference", "==", externalReference).limit(1).get();
  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0]?.data() as (ConnectionRecord & { userId: string }) | null;
};

const parseCreateBankLinkSessionInput = (input: any) => ({
  provider: input?.provider === "powens" ? "powens" : invalidArgument("provider must be 'powens'"),
  redirectUrl: optionalUrl(input?.redirectUrl, "redirectUrl")
});

const parseManualSyncInput = (input: any) => ({
  connectionId: optionalString(input?.connectionId)
});

const parseDisconnectInput = (input: any) => ({
  connectionId: requiredString(input?.connectionId, "connectionId")
});

const parseCreateCsvUploadInput = (input: any) => ({
  fileName: optionalString(input?.fileName) ?? "transactions.csv"
});

const parseConfirmCsvImportInput = (input: any) => ({
  importId: requiredString(input?.importId, "importId"),
  mapping: {
    date: requiredString(input?.mapping?.date, "mapping.date"),
    amount: requiredString(input?.mapping?.amount, "mapping.amount"),
    label: requiredString(input?.mapping?.label, "mapping.label"),
    merchant: optionalString(input?.mapping?.merchant),
    accountLabel: optionalString(input?.mapping?.accountLabel),
    category: optionalString(input?.mapping?.category)
  },
  accountMeta: {
    label: requiredString(input?.accountMeta?.label, "accountMeta.label"),
    currency: optionalString(input?.accountMeta?.currency) ?? "EUR",
    currentBalance: optionalNumber(input?.accountMeta?.currentBalance)
  }
});

const requiredString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${field} is required`);
  }

  return value;
};

const optionalString = (value: unknown) => (typeof value === "string" && value.trim().length > 0 ? value : undefined);

const optionalUrl = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${field} must be a string URL`);
  }

  try {
    new URL(value);
    return value;
  } catch {
    throw new HttpsError("invalid-argument", `${field} must be a valid URL`);
  }
};

const optionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new HttpsError("invalid-argument", "currentBalance must be a number");
  }

  return value;
};

const invalidArgument = (message: string): never => {
  throw new HttpsError("invalid-argument", message);
};
