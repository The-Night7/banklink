import { DEFAULT_FIREBASE_PUBLIC_CONFIG } from "./constants";

export type ClientEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY: string;
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  EXPO_PUBLIC_FIREBASE_APP_ID: string;
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
  EXPO_PUBLIC_USE_FIREBASE_EMULATORS: boolean;
};

export type ServerEnv = {
  POWENS_CLIENT_ID: string;
  POWENS_CLIENT_SECRET: string;
  POWENS_BASE_URL: string;
  POWENS_WEBHOOK_SECRET: string;
  SENTRY_DSN: string;
};

export const readClientEnv = (input: Record<string, string | undefined>): ClientEnv => ({
  EXPO_PUBLIC_FIREBASE_API_KEY:
    input.EXPO_PUBLIC_FIREBASE_API_KEY ?? DEFAULT_FIREBASE_PUBLIC_CONFIG.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
    input.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? DEFAULT_FIREBASE_PUBLIC_CONFIG.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID:
    input.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? DEFAULT_FIREBASE_PUBLIC_CONFIG.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
    input.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? DEFAULT_FIREBASE_PUBLIC_CONFIG.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    input.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    DEFAULT_FIREBASE_PUBLIC_CONFIG.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID:
    input.EXPO_PUBLIC_FIREBASE_APP_ID ?? DEFAULT_FIREBASE_PUBLIC_CONFIG.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID:
    input.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ??
    DEFAULT_FIREBASE_PUBLIC_CONFIG.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  EXPO_PUBLIC_USE_FIREBASE_EMULATORS: parseBoolean(input.EXPO_PUBLIC_USE_FIREBASE_EMULATORS)
});

export const readServerEnv = (input: Record<string, string | undefined>): ServerEnv => ({
  POWENS_CLIENT_ID: requireString(input, "POWENS_CLIENT_ID"),
  POWENS_CLIENT_SECRET: requireString(input, "POWENS_CLIENT_SECRET"),
  POWENS_BASE_URL: requireUrl(input, "POWENS_BASE_URL"),
  POWENS_WEBHOOK_SECRET: requireString(input, "POWENS_WEBHOOK_SECRET"),
  SENTRY_DSN: input.SENTRY_DSN ?? ""
});

const requireString = (input: Record<string, string | undefined>, key: string) => {
  const value = input[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const requireUrl = (input: Record<string, string | undefined>, key: string) => {
  const value = requireString(input, key);
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Invalid URL for environment variable: ${key}`);
  }
};

const parseBoolean = (value: string | undefined) => value === "true";
