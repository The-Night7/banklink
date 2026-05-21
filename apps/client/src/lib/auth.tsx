import type { UserProfile } from "@budgetlink/domain";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  completeOnboarding: (payload: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser: User | null) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileRef = doc(firestore, `users/${user.uid}`);
    const unsubscribe = onSnapshot(profileRef, async (snapshot: any) => {
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
        setProfile(fallbackProfile);
        return;
      }

      setProfile(snapshot.data() as UserProfile);
    });

    return unsubscribe;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUpWithEmail: async (email, password, displayName) => {
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
      },
      signInWithGoogle: async () => {
        if (Platform.OS !== "web") {
          throw new Error("Google sign-in mobile requires native OAuth client IDs");
        }

        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },
      signOutUser: async () => {
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
      }
    }),
    [loading, profile, user]
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
