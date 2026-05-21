import { readClientEnv } from "@budgetlink/config";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { Platform } from "react-native";

const env = readClientEnv({
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  EXPO_PUBLIC_FIREBASE_APPCHECK_SITE_KEY: process.env.EXPO_PUBLIC_FIREBASE_APPCHECK_SITE_KEY,
  EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: process.env.EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN,
  EXPO_PUBLIC_USE_FIREBASE_EMULATORS: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS
});

export const firebaseApp = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
});

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp, "europe-west1");
export const storage = getStorage(firebaseApp);

let emulatorsConnected = false;
let appCheckInitialized = false;

if (Platform.OS === "web" && env.EXPO_PUBLIC_FIREBASE_APPCHECK_SITE_KEY && !appCheckInitialized) {
  if (env.EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN) {
    (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      env.EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN === "true"
        ? true
        : env.EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
  }

  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(env.EXPO_PUBLIC_FIREBASE_APPCHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
  appCheckInitialized = true;
}

if (env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS && !emulatorsConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  emulatorsConnected = true;
}
