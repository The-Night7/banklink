import type { Transaction } from "@budgetlink/domain";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { categoryLabel } from "@budgetlink/domain";
import { Card, Chip, colors, spacing } from "@budgetlink/ui";

import { formatCurrency, formatDate } from "../lib/format";

export const TransactionListItem = ({
  transaction,
  onPress
}: {
  transaction: Transaction;
  onPress?: () => void;
}) => (
  <Pressable onPress={onPress}>
    <Card>
      <View style={styles.row}>
        <View style={styles.main}>
          <Text style={styles.label}>{transaction.rawLabel}</Text>
          <Text style={styles.meta}>
            {formatDate(transaction.date)} · {transaction.merchantName || "Operation"}
          </Text>
        </View>
        <Text style={[styles.amount, { color: transaction.amount > 0 ? colors.success : colors.text }]}>
          {formatCurrency(transaction.amount)}
        </Text>
      </View>
      <View style={styles.chips}>
        <Chip label={categoryLabel(transaction.categoryId)} />
        {transaction.flags.needsReview ? <Chip label="A revoir" tone="warning" /> : null}
      </View>
    </Card>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  main: {
    flex: 1,
    gap: 4
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13
  },
  amount: {
    fontSize: 16,
    fontWeight: "700"
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  }
});
