import type { CategoryId } from "@budgetlink/config";

import type {
  Account,
  Budget,
  BudgetProgress,
  GoalProgress,
  MonthlySummary,
  SavingsGoal,
  Transaction
} from "./types";

export const toMonthKey = (dateInput: string) => {
  const date = new Date(dateInput);
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
};

export const stableTransactionHash = (parts: string[]) => {
  const input = parts.join("|");
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return Math.abs(hash >>> 0).toString(36);
};

export const detectInternalTransfer = (transaction: Pick<Transaction, "normalizedLabel" | "categoryId">) =>
  transaction.categoryId === "transfers" ||
  /\b(virement|vir|transfer|versement)\b/.test(transaction.normalizedLabel);

export const createMonthlySummary = ({
  userId,
  month,
  transactions
}: {
  userId: string;
  month: string;
  transactions: Transaction[];
}): MonthlySummary => {
  const monthlyTransactions = transactions.filter((transaction) => toMonthKey(transaction.date) === month);
  const categoryTotals: Partial<Record<CategoryId, number>> = {};

  let income = 0;
  let expenses = 0;

  for (const transaction of monthlyTransactions) {
    if (transaction.flags.excludedFromReports || transaction.flags.isInternalTransfer) {
      continue;
    }

    if (transaction.amount > 0) {
      income += transaction.amount;
    } else {
      expenses += Math.abs(transaction.amount);
      categoryTotals[transaction.categoryId] =
        (categoryTotals[transaction.categoryId] ?? 0) + Math.abs(transaction.amount);
    }
  }

  return {
    id: `${userId}:${month}`,
    userId,
    month,
    income: roundCurrency(income),
    expenses: roundCurrency(expenses),
    netSavings: roundCurrency(income - expenses),
    categoryTotals,
    transactionsCount: monthlyTransactions.length,
    generatedAt: new Date().toISOString()
  };
};

export const computeBudgetProgress = ({
  budgets,
  summary
}: {
  budgets: Budget[];
  summary: MonthlySummary;
}): BudgetProgress[] =>
  budgets
    .filter((budget) => budget.month === summary.month)
    .map((budget) => {
      const spent = roundCurrency(summary.categoryTotals[budget.categoryId] ?? 0);
      const ratio = budget.limitAmount === 0 ? 0 : spent / budget.limitAmount;
      const severity = ratio >= budget.dangerThreshold ? "danger" : ratio >= budget.warningThreshold ? "warning" : "ok";

      return {
        ...budget,
        spent,
        remaining: roundCurrency(Math.max(budget.limitAmount - spent, 0)),
        ratio,
        severity
      };
    });

export const computeGoalProgress = ({
  goals,
  accounts,
  summaries
}: {
  goals: SavingsGoal[];
  accounts: Account[];
  summaries: MonthlySummary[];
}): GoalProgress[] => {
  const averageSavings = summaries.length
    ? summaries.reduce((total, summary) => total + summary.netSavings, 0) / summaries.length
    : 0;

  return goals.map((goal) => {
    const currentAmount = goal.accountAllocations.length
      ? goal.accountAllocations.reduce((total, allocation) => {
          const account = accounts.find((item) => item.id === allocation.accountId);
          return total + (account?.currentBalance ?? 0) * allocation.weight;
        }, 0)
      : goal.currentAmount;

    const ratio = goal.targetAmount === 0 ? 0 : currentAmount / goal.targetAmount;
    const monthsLeft = averageSavings > 0 ? Math.ceil(Math.max(goal.targetAmount - currentAmount, 0) / averageSavings) : null;
    const projectedCompletionDate =
      monthsLeft === null ? null : shiftMonth(new Date(), monthsLeft).toISOString().slice(0, 10);

    return {
      ...goal,
      currentAmount: roundCurrency(currentAmount),
      completionRatio: Math.min(ratio, 1),
      projectedMonthlySavings: roundCurrency(averageSavings),
      projectedCompletionDate
    };
  });
};

export const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const shiftMonth = (date: Date, months: number) => {
  const copy = new Date(date);
  copy.setUTCMonth(copy.getUTCMonth() + months);
  return copy;
};
