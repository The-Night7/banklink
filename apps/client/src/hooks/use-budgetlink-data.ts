import { orderBy, where } from "firebase/firestore";

import type { Account, BankConnection, Budget, MonthlySummary, SavingsGoal, Transaction } from "@budgetlink/domain";

import { useAuth } from "../lib/auth";
import { useLiveCollection } from "./use-live-collection";

export const useAccounts = () => {
  const { user } = useAuth();
  return useLiveCollection<Account>(user ? `users/${user.uid}/accounts` : null, [orderBy("label", "asc")]);
};

export const useConnections = () => {
  const { user } = useAuth();
  return useLiveCollection<BankConnection>(user ? `users/${user.uid}/bankConnections` : null, [orderBy("updatedAt", "desc")]);
};

export const useTransactions = () => {
  const { user } = useAuth();
  return useLiveCollection<Transaction>(user ? `users/${user.uid}/transactions` : null, [orderBy("date", "desc")]);
};

export const useBudgets = (month?: string) => {
  const { user } = useAuth();
  return useLiveCollection<Budget>(
    user ? `users/${user.uid}/budgets` : null,
    month ? [where("month", "==", month), orderBy("categoryId", "asc")] : [orderBy("month", "desc")]
  );
};

export const useGoals = () => {
  const { user } = useAuth();
  return useLiveCollection<SavingsGoal>(user ? `users/${user.uid}/goals` : null, [orderBy("createdAt", "desc")]);
};

export const useMonthlySummaries = () => {
  const { user } = useAuth();
  return useLiveCollection<MonthlySummary>(user ? `users/${user.uid}/monthlySummaries` : null, [orderBy("month", "desc")]);
};
