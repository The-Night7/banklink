import { CATEGORY_DEFINITIONS, CATEGORY_BY_ID } from "@budgetlink/config";
import { computeBudgetProgress, createMonthlySummary } from "@budgetlink/domain";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Card, ProgressBar, Screen, SectionHeader, colors, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../../src/components/ActionButton";
import { PickerField } from "../../../src/components/PickerField";
import { TextField } from "../../../src/components/TextField";
import { useBudgets, useTransactions } from "../../../src/hooks/use-budgetlink-data";
import { createBudget } from "../../../src/lib/data";
import { useAuth } from "../../../src/lib/auth";
import { formatCurrency } from "../../../src/lib/format";

const currentMonth = new Date().toISOString().slice(0, 7);

export default function BudgetsScreen() {
  const { user } = useAuth();
  const { data: budgets } = useBudgets(currentMonth);
  const { data: transactions } = useTransactions();
  const [categoryId, setCategoryId] = useState(CATEGORY_DEFINITIONS[0]?.id ?? "food");
  const [limitAmount, setLimitAmount] = useState("500");
  const [loading, setLoading] = useState(false);
  const summary = transactions.length
    ? createMonthlySummary({
        userId: user?.uid ?? "local",
        month: currentMonth,
        transactions
      })
    : null;
  const progress = summary ? computeBudgetProgress({ budgets, summary }) : [];

  const submit = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      await createBudget({
        userId: user.uid,
        month: currentMonth,
        categoryId,
        limitAmount: Number(limitAmount)
      });
      setLimitAmount("500");
    } catch (error) {
      Alert.alert("Budget non cree", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Budgets" subtitle={`Plafonds mensuels pour ${currentMonth}`}>
      <Card>
        <SectionHeader title="Nouveau budget" description="Definis un plafond mensuel par categorie" />
        <View style={styles.form}>
          <PickerField
            label="Categorie"
            selectedValue={categoryId}
            onValueChange={(value) => setCategoryId(value as typeof categoryId)}
            items={CATEGORY_DEFINITIONS.map((category) => ({ label: category.label, value: category.id }))}
          />
          <TextField label="Plafond" value={limitAmount} onChangeText={setLimitAmount} keyboardType="numeric" placeholder="500" />
          <ActionButton label="Ajouter ce budget" onPress={submit} loading={loading} />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Suivi du mois" description="Progression des enveloppes actives" />
        <View style={styles.form}>
          {progress.length ? (
            progress.map((budget) => (
              <View key={budget.id} style={styles.item}>
                <Text style={styles.itemTitle}>
                  {CATEGORY_BY_ID[budget.categoryId].label} · {formatCurrency(budget.limitAmount)}
                </Text>
                <ProgressBar
                  label="Consomme"
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
              </View>
            ))
          ) : (
            <Text style={styles.caption}>Aucun budget pour le mois courant.</Text>
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  item: {
    gap: spacing.sm
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13
  }
});
