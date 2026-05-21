import type { UserProfile } from "@budgetlink/domain";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { auth, firestore } from "./firebase";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authFeedback: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  completeOnboarding: (payload: Partial<UserProfile>) => Promise<void>;
  clearAuthFeedback: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, (nextUser: User | null) => {
      if (!active) {
        return;
      }

      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    let active = true;

    void getRedirectResult(auth).catch((error: unknown) => {
      if (!active) {
        return;
      }

      setAuthFeedback(describeAuthError(error));
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let active = true;
    const profileRef = doc(firestore, `users/${user.uid}`);
    const unsubscribe = onSnapshot(profileRef, async (snapshot: any) => {
      if (!active) {
        return;
      }

      if (!snapshot.exists()) {
        const now = new Date().toISOString();
        const fallbackProfile: UserProfile = {
          id: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? "Utilisateur BudgetLink",
          locale: "fr-FR",
          currency: "EUR",
          onboardingCompleted: false,
          createdAt: now,
          updatedAt: now
        };
        await setDoc(profileRef, fallbackProfile, { merge: true });
        if (active) {
          setProfile(fallbackProfile);
        }
        return;
      }

      if (active) {
        setProfile(snapshot.data() as UserProfile);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      authFeedback,
      signInWithEmail: async (email, password) => {
        setAuthFeedback(null);
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
          const message = describeAuthError(error);
          setAuthFeedback(message);
          throw new Error(message);
        }
      },
      signUpWithEmail: async (email, password, displayName) => {
        setAuthFeedback(null);
        try {
          const credentials = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(credentials.user, { displayName });
          await setDoc(
            doc(firestore, `users/${credentials.user.uid}`),
            {
              id: credentials.user.uid,
              email,
              displayName,
              locale: "fr-FR",
              currency: "EUR",
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        } catch (error) {
          const message = describeAuthError(error);
          setAuthFeedback(message);
          throw new Error(message);
        }
      },
      signInWithGoogle: async () => {
        if (Platform.OS !== "web") {
          const message =
            "Google sur mobile necessite encore des client IDs OAuth natifs. Utilise email/mot de passe dans Expo Go pour l'instant.";
          setAuthFeedback(message);
          throw new Error(message);
        }

        const provider = new GoogleAuthProvider() as any;
        provider.addScope?.("email");
        provider.addScope?.("profile");
        provider.setCustomParameters?.({ prompt: "select_account" });
        setAuthFeedback(null);

        try {
          if (shouldPreferRedirect()) {
            await signInWithRedirect(auth, provider);
            return;
          }

          await signInWithPopup(auth, provider);
        } catch (error) {
          const code = getFirebaseErrorCode(error);

          if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
            setAuthFeedback("La fenetre Google a ete bloquee. Redirection vers Google en cours.");
            await signInWithRedirect(auth, provider);
            return;
          }

          const message = describeAuthError(error);
          setAuthFeedback(message);
          throw new Error(message);
        }
      },
      signOutUser: async () => {
        setAuthFeedback(null);
        await signOut(auth);
      },
      completeOnboarding: async (payload) => {
        if (!user) {
          return;
        }

        await setDoc(
          doc(firestore, `users/${user.uid}`),
          {
            ...profile,
            ...payload,
            id: user.uid,
            email: user.email ?? profile?.email ?? "",
            displayName: payload.displayName ?? profile?.displayName ?? user.displayName ?? "Utilisateur BudgetLink",
            locale: payload.locale ?? profile?.locale ?? "fr-FR",
            currency: payload.currency ?? profile?.currency ?? "EUR",
            onboardingCompleted: true,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      },
      clearAuthFeedback: () => {
        setAuthFeedback(null);
      }
    }),
    [authFeedback, loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
};

const getFirebaseErrorCode = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";

const describeAuthError = (error: unknown) => {
  const code = getFirebaseErrorCode(error);

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email ou mot de passe incorrect.";
    case "auth/email-already-in-use":
      return "Cet email est deja utilise.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible. Utilise au moins 8 caracteres.";
    case "auth/popup-closed-by-user":
      return "La fenetre Google a ete fermee avant la fin de la connexion.";
    case "auth/popup-blocked":
    case "auth/cancelled-popup-request":
      return "Le navigateur a bloque la fenetre Google. Une redirection va etre tentee.";
    case "auth/operation-not-allowed":
      return "Le provider Google n'est pas active dans Firebase Auth. Active Authentication > Sign-in method > Google.";
    case "auth/unauthorized-domain":
      return `Le domaine ${currentHostLabel()} n'est pas autorise dans Firebase Auth. Ajoute-le dans Authentication > Settings > Authorized domains.`;
    case "auth/app-not-authorized":
      return "Cette application Firebase n'est pas autorisee pour Google. Verifie la cle API, l'authDomain et la configuration Web du projet.";
    case "auth/invalid-api-key":
      return "La configuration Firebase du client est incomplete. Verifie les variables EXPO_PUBLIC_FIREBASE_* ou le fallback du projet.";
    case "auth/account-exists-with-different-credential":
      return "Un compte existe deja avec ce meme email mais une autre methode de connexion.";
    case "auth/network-request-failed":
      return "La requete reseau a echoue. Verifie ta connexion.";
    default:
      return error instanceof Error ? error.message : "Erreur d'authentification inconnue.";
  }
};

const shouldPreferRedirect = () => {
  if (Platform.OS !== "web" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileBrowser = /android|iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|android/.test(userAgent);

  return isMobileBrowser || isSafari;
};

const currentHostLabel = () => {
  if (typeof window === "undefined" || !window.location.host) {
    return "actuel";
  }

  return window.location.host;
};
