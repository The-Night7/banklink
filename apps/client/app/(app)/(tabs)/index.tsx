import { CATEGORY_BY_ID } from "@budgetlink/config";
import { computeBudgetProgress, computeGoalProgress, createMonthlySummary } from "@budgetlink/domain";
import { BarChart, Card, EmptyState, LineChart, ProgressBar, Screen, SectionHeader, SemiDonutChart, StatCard, colors, spacing } from "@budgetlink/ui";
import { StyleSheet, Text, View } from "react-native";

import { useAccounts, useBudgets, useGoals, useMonthlySummaries, useTransactions } from "../../../src/hooks/use-budgetlink-data";
import { formatCurrency, formatMonth } from "../../../src/lib/format";

const currentMonth = new Date().toISOString().slice(0, 7);

export default function DashboardScreen() {
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactions();
  const { data: summaries } = useMonthlySummaries();
  const { data: budgets } = useBudgets(currentMonth);
  const { data: goals } = useGoals();

  const currentSummary =
    summaries.find((summary) => summary.month === currentMonth) ??
    (transactions.length
      ? createMonthlySummary({
          userId: transactions[0]?.userId ?? "local",
          month: currentMonth,
          transactions
        })
      : null);
  const recentSummaries = [...summaries].sort((left, right) => left.month.localeCompare(right.month)).slice(-6);
  const budgetProgress = currentSummary ? computeBudgetProgress({ budgets, summary: currentSummary }) : [];
  const goalProgress = computeGoalProgress({ goals, accounts, summaries: summaries.slice(0, 6) });
  const totalBalance = accounts.reduce((total, account) => total + account.currentBalance, 0);
  const topCategories = currentSummary
    ? Object.entries(currentSummary.categoryTotals)
        .map(([categoryId, value]) => ({
          label: CATEGORY_BY_ID[categoryId as keyof typeof CATEGORY_BY_ID]?.label ?? categoryId,
          value: value ?? 0,
          color: CATEGORY_BY_ID[categoryId as keyof typeof CATEGORY_BY_ID]?.color ?? colors.accentStrong
        }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 5)
    : [];

  return (
    <Screen title="Accueil" subtitle={`Synthese du mois de ${formatMonth(currentMonth)}`}>
      <View style={styles.grid}>
        <StatCard label="Solde total" value={formatCurrency(totalBalance)} hint={`${accounts.length} comptes connectes`} />
        <StatCard label="Revenus" value={formatCurrency(currentSummary?.income ?? 0)} accent={colors.success} />
        <StatCard label="Depenses" value={formatCurrency(-(currentSummary?.expenses ?? 0))} accent={colors.warning} />
        <StatCard label="Epargne nette" value={formatCurrency(currentSummary?.netSavings ?? 0)} accent={colors.accentStrong} />
      </View>

      {currentSummary ? (
        <>
          <Card>
            <SectionHeader title="Cashflow" description="Evolution des 6 derniers mois" />
            <LineChart
              data={recentSummaries.map((summary) => ({
                label: summary.month,
                value: summary.netSavings
              }))}
            />
          </Card>

          <Card>
            <SectionHeader title="Depenses par categorie" description="Top categories du mois courant" />
            <BarChart data={topCategories} />
          </Card>

          <Card>
            <SectionHeader title="Repartition depenses" description="Vue semi-circulaire pour les postes principaux" />
            <SemiDonutChart data={topCategories} valueLabel={formatCurrency(-(currentSummary.expenses || 0))} />
          </Card>
        </>
      ) : (
        <EmptyState
          title="Aucune donnee synchronisee"
          description="Connecte une banque ou importe un CSV depuis l'onglet Comptes pour initialiser les graphes."
        />
      )}

      <Card>
        <SectionHeader title="Budgets du mois" description="Suivi categorie par categorie" />
        <View style={styles.stack}>
          {budgetProgress.length ? (
            budgetProgress.map((budget) => (
              <ProgressBar
                key={budget.id}
                label={CATEGORY_BY_ID[budget.categoryId].label}
                value={budget.spent}
                total={budget.limitAmount}
                color={
                  budget.severity === "danger"
                    ? colors.danger
                    : budget.severity === "warning"
                      ? colors.warning
                      : colors.accentStrong
                }
              />
            ))
          ) : (
            <Text style={styles.caption}>Aucun budget defini pour ce mois.</Text>
          )}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Objectifs d'epargne" description="Progression et projection" />
        <View style={styles.stack}>
          {goalProgress.length ? (
            goalProgress.map((goal) => (
              <View key={goal.id} style={styles.goalRow}>
                <Text style={styles.goalTitle}>{goal.name}</Text>
                <Text style={styles.caption}>
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </Text>
                <ProgressBar label="Progression" value={goal.currentAmount} total={goal.targetAmount} color={colors.success} />
                <Text style={styles.caption}>
                  Projection: {goal.projectedCompletionDate ?? "impossible a estimer"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.caption}>Aucun objectif cree.</Text>
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  stack: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13
  },
  goalRow: {
    gap: spacing.sm
  },
  goalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  }
});
