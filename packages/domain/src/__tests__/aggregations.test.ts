import { describe, expect, it } from "vitest";

import { computeBudgetProgress, computeGoalProgress, createMonthlySummary, stableTransactionHash } from "../aggregations";
import type { Account, Budget, MonthlySummary, SavingsGoal, Transaction } from "../types";

const now = "2025-01-15T00:00:00.000Z";

const transactions: Transaction[] = [
  {
    id: "tx-1",
    userId: "user-1",
    accountId: "account-1",
    connectionId: "conn-1",
    source: "powens",
    providerTransactionId: "pow-1",
    date: "2025-01-02T00:00:00.000Z",
    bookedAt: now,
    amount: -120,
    currency: "EUR",
    rawLabel: "Loyer Janvier",
    normalizedLabel: "loyer janvier",
    merchantName: "agence",
    providerCategory: "housing",
    categoryId: "housing",
    categoryConfidence: 0.9,
    dedupeHash: "abc",
    notes: null,
    flags: {
      isInternalTransfer: false,
      isRecurring: true,
      excludedFromReports: false,
      needsReview: false,
      userEditedCategory: false
    },
    createdAt: now,
    updatedAt: now
  },
  {
    id: "tx-2",
    userId: "user-1",
    accountId: "account-1",
    connectionId: "conn-1",
    source: "powens",
    providerTransactionId: "pow-2",
    date: "2025-01-05T00:00:00.000Z",
    bookedAt: now,
    amount: 1800,
    currency: "EUR",
    rawLabel: "Salaire",
    normalizedLabel: "salaire",
    merchantName: "employeur",
    providerCategory: "salary",
    categoryId: "income",
    categoryConfidence: 0.9,
    dedupeHash: "def",
    notes: null,
    flags: {
      isInternalTransfer: false,
      isRecurring: true,
      excludedFromReports: false,
      needsReview: false,
      userEditedCategory: false
    },
    createdAt: now,
    updatedAt: now
  }
];

describe("aggregations", () => {
  it("creates a stable hash", () => {
    expect(stableTransactionHash(["a", "b", "c"])).toBe(stableTransactionHash(["a", "b", "c"]));
  });

  it("builds a monthly summary", () => {
    const summary = createMonthlySummary({
      userId: "user-1",
      month: "2025-01",
      transactions
    });

    expect(summary.income).toBe(1800);
    expect(summary.expenses).toBe(120);
    expect(summary.netSavings).toBe(1680);
  });

  it("computes budget progress and goal progress", () => {
    const summary: MonthlySummary = createMonthlySummary({
      userId: "user-1",
      month: "2025-01",
      transactions
    });
    const budgets: Budget[] = [
      {
        id: "budget-1",
        userId: "user-1",
        month: "2025-01",
        categoryId: "housing",
        limitAmount: 1000,
        warningThreshold: 0.7,
        dangerThreshold: 0.9,
        createdAt: now,
        updatedAt: now
      }
    ];
    const accounts: Account[] = [
      {
        id: "account-1",
        userId: "user-1",
        connectionId: "conn-1",
        provider: "powens",
        externalId: "ext-1",
        type: "checking",
        label: "Compte courant",
        maskedIban: "FR76********1234",
        currency: "EUR",
        currentBalance: 2600,
        availableBalance: 2400,
        lastUpdatedAt: now
      }
    ];
    const goals: SavingsGoal[] = [
      {
        id: "goal-1",
        userId: "user-1",
        name: "Coussin de securite",
        targetAmount: 5000,
        currentAmount: 1200,
        targetDate: null,
        accountAllocations: [{ accountId: "account-1", weight: 1 }],
        createdAt: now,
        updatedAt: now
      }
    ];

    const budgetProgress = computeBudgetProgress({ budgets, summary });
    expect(budgetProgress[0]?.spent).toBe(120);
    expect(budgetProgress[0]?.severity).toBe("ok");

    const goalProgress = computeGoalProgress({ goals, accounts, summaries: [summary] });
    expect(goalProgress[0]?.currentAmount).toBe(2600);
    expect(goalProgress[0]?.completionRatio).toBeCloseTo(0.52, 2);
  });
});
