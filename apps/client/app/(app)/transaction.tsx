import { CATEGORY_DEFINITIONS } from "@budgetlink/config";
import type { CategoryId, Transaction } from "@budgetlink/domain";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, Screen, colors, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../src/components/ActionButton";
import { PickerField } from "../../src/components/PickerField";
import { useLiveDocument } from "../../src/hooks/use-live-collection";
import { useAuth } from "../../src/lib/auth";
import { updateTransactionCategory } from "../../src/lib/data";
import { formatCurrency, formatDate } from "../../src/lib/format";

export default function TransactionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const transactionId = typeof params.id === "string" ? params.id : null;
  const { data: transaction } = useLiveDocument<Transaction>(
    user && transactionId ? `users/${user.uid}/transactions/${transactionId}` : null
  );
  const [categoryId, setCategoryId] = useState<CategoryId>("other");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setCategoryId(transaction.categoryId);
    }
  }, [transaction]);

  const submit = async () => {
    if (!user || !transaction) {
      return;
    }

    try {
      setLoading(true);
      await updateTransactionCategory({
        userId: user.uid,
        transaction,
        categoryId
      });
      router.back();
    } catch (error) {
      Alert.alert("Categorie non enregistree", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (!transactionId || !transaction) {
    return (
      <Screen title="Transaction">
        <EmptyState title="Introuvable" description="La transaction n'existe plus ou n'a pas encore ete synchronisee." />
      </Screen>
    );
  }

  return (
    <Screen title="Detail transaction" subtitle={transaction.rawLabel}>
      <Card>
        <View style={styles.stack}>
          <Text style={styles.amount}>{formatCurrency(transaction.amount, transaction.currency)}</Text>
          <Text style={styles.caption}>{formatDate(transaction.date)}</Text>
          <Text style={styles.caption}>Marchand: {transaction.merchantName || "non detecte"}</Text>
          <Text style={styles.caption}>Confiance: {(transaction.categoryConfidence * 100).toFixed(0)}%</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.stack}>
          <PickerField
            label="Categorie"
            selectedValue={categoryId}
            onValueChange={(value) => setCategoryId(value as CategoryId)}
            items={CATEGORY_DEFINITIONS.map((category) => ({ label: category.label, value: category.id }))}
          />
          <Text style={styles.caption}>
            L'enregistrement cree aussi une regle marchand reutilisable pour les prochaines operations similaires.
          </Text>
          <ActionButton label="Enregistrer la categorie" onPress={submit} loading={loading} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md
  },
  amount: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700"
  },
  caption: {
    color: colors.textMuted,
    fontSize: 14
  }
});
