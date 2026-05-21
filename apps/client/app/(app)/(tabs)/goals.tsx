import { computeGoalProgress } from "@budgetlink/domain";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Card, ProgressBar, Screen, SectionHeader, colors, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../../src/components/ActionButton";
import { TextField } from "../../../src/components/TextField";
import { useAccounts, useGoals, useMonthlySummaries } from "../../../src/hooks/use-budgetlink-data";
import { useAuth } from "../../../src/lib/auth";
import { createGoal } from "../../../src/lib/data";
import { formatCurrency } from "../../../src/lib/format";

export default function GoalsScreen() {
  const { user } = useAuth();
  const { data: goals } = useGoals();
  const { data: accounts } = useAccounts();
  const { data: summaries } = useMonthlySummaries();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("3000");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const progress = computeGoalProgress({ goals, accounts, summaries: summaries.slice(0, 6) });

  const submit = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      await createGoal({
        userId: user.uid,
        name,
        targetAmount: Number(targetAmount),
        targetDate: targetDate || undefined
      });
      setName("");
      setTargetAmount("3000");
      setTargetDate("");
    } catch (error) {
      Alert.alert("Objectif non cree", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Objectifs" subtitle="Pilote tes objectifs d'epargne avec une projection simple">
      <Card>
        <SectionHeader title="Nouvel objectif" description="Ajoute une cible et une date optionnelle" />
        <View style={styles.form}>
          <TextField label="Nom" value={name} onChangeText={setName} placeholder="Voyage, fonds d'urgence..." />
          <TextField label="Montant cible" value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" placeholder="3000" />
          <TextField label="Date cible" value={targetDate} onChangeText={setTargetDate} placeholder="2025-12-31" />
          <ActionButton label="Creer l'objectif" onPress={submit} loading={loading} />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Progression" description="Projection basee sur l'epargne nette recente" />
        <View style={styles.form}>
          {progress.length ? (
            progress.map((goal) => (
              <View key={goal.id} style={styles.item}>
                <Text style={styles.title}>{goal.name}</Text>
                <Text style={styles.caption}>
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </Text>
                <ProgressBar label="Atteinte" value={goal.currentAmount} total={goal.targetAmount} color={colors.success} />
                <Text style={styles.caption}>Projection: {goal.projectedCompletionDate ?? "non disponible"}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.caption}>Aucun objectif defini.</Text>
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
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13
  }
});
