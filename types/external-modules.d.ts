declare module "react" {
  export type PropsWithChildren<T = Record<string, unknown>> = T & { children?: any };
  export type ReactNode = any;
  export type JSXElementConstructor<T> = any;
  export type Context<T> = { Provider: any; Consumer: any; _value?: T };
  export function createContext<T>(value: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T>(initialState: T): [T, (value: T | ((current: T) => T)) => void];
}

declare module "react/jsx-runtime" {
  export namespace JSX {
    interface IntrinsicAttributes {
      key?: any;
    }
  }
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module "react-native" {
  export const ActivityIndicator: any;
  export const Alert: any;
  export const Platform: any;
  export const Pressable: any;
  export const SafeAreaView: any;
  export const ScrollView: any;
  export const StyleSheet: { create<T>(styles: T): T };
  export const Text: any;
  export const TextInput: any;
  export const View: any;
}

declare module "react-native-svg" {
  const Svg: any;
  export default Svg;
  export const Circle: any;
  export const G: any;
  export const Path: any;
  export const Rect: any;
}

declare module "d3-scale" {
  export function scaleBand<T = string>(): any;
  export function scaleLinear(): any;
}

declare module "d3-shape" {
  export const curveMonotoneX: any;
  export function arc<T = any>(): any;
  export function line<T = any>(): any;
  export function pie<T = any>(): any;
}

declare module "expo-router" {
  export const Redirect: any;
  export const Slot: any;
  export const Stack: any;
  export const Tabs: any;
  export function useLocalSearchParams<T = any>(): T;
  export function useRouter(): any;
}

declare module "expo-status-bar" {
  export const StatusBar: any;
}

declare module "expo-linking" {
  export function createURL(path?: string): string;
  export function openURL(url: string): Promise<void>;
}

declare module "@tanstack/react-query" {
  export class QueryClient {}
  export const QueryClientProvider: any;
}

declare module "@react-native-picker/picker" {
  export const Picker: any;
}

declare module "firebase/app" {
  export function initializeApp(config: any): any;
}

declare module "firebase/auth" {
  export class GoogleAuthProvider {}
  export type User = any;
  export function createUserWithEmailAndPassword(...args: any[]): Promise<any>;
  export function getAuth(...args: any[]): any;
  export function onAuthStateChanged(...args: any[]): () => void;
  export function signInWithEmailAndPassword(...args: any[]): Promise<any>;
  export function signInWithPopup(...args: any[]): Promise<any>;
  export function signInWithRedirect(...args: any[]): Promise<any>;
  export function signOut(...args: any[]): Promise<void>;
  export function updateProfile(...args: any[]): Promise<void>;
  export function connectAuthEmulator(...args: any[]): void;
}

declare module "firebase/firestore" {
  export type DocumentData = any;
  export type QueryConstraint = any;
  export function collection(...args: any[]): any;
  export function connectFirestoreEmulator(...args: any[]): void;
  export function doc(...args: any[]): any;
  export function getDocs(...args: any[]): Promise<any>;
  export function getFirestore(...args: any[]): any;
  export function onSnapshot(...args: any[]): () => void;
  export function orderBy(...args: any[]): any;
  export function query(...args: any[]): any;
  export function setDoc(...args: any[]): Promise<void>;
  export function updateDoc(...args: any[]): Promise<void>;
  export function where(...args: any[]): any;
}

declare module "firebase/functions" {
  export function connectFunctionsEmulator(...args: any[]): void;
  export function getFunctions(...args: any[]): any;
  export function httpsCallable<T = any, R = any>(...args: any[]): (data: T) => Promise<{ data: R }>;
}

declare module "firebase/storage" {
  export function connectStorageEmulator(...args: any[]): void;
  export function getStorage(...args: any[]): any;
}

declare module "firebase-admin/app" {
  export function getApps(): any[];
  export function initializeApp(...args: any[]): any;
}

declare module "firebase-admin/firestore" {
  export type WriteBatch = any;
  export function getFirestore(...args: any[]): any;
}

declare module "firebase-admin/storage" {
  export function getStorage(...args: any[]): any;
}

declare module "firebase-functions" {
  export const logger: any;
}

declare module "firebase-functions/params" {
  export function defineSecret(name: string): { value(): string };
}

declare module "firebase-functions/v2/https" {
  export class HttpsError extends Error {
    constructor(code: string, message: string);
  }
  export function onCall(...args: any[]): any;
  export function onRequest(...args: any[]): any;
}

declare module "firebase-functions/v2/scheduler" {
  export function onSchedule(...args: any[]): any;
}

declare module "csv-parse/sync" {
  export function parse(input: string, options?: any): any[];
}
