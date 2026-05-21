import { CATEGORY_DEFINITIONS } from "@budgetlink/config";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState, Screen, spacing } from "@budgetlink/ui";

import { PickerField } from "../../../src/components/PickerField";
import { TextField } from "../../../src/components/TextField";
import { TransactionListItem } from "../../../src/components/TransactionListItem";
import { useTransactions } from "../../../src/hooks/use-budgetlink-data";

export default function TransactionsScreen() {
  const router = useRouter();
  const { data: transactions } = useTransactions();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesSearch =
          transaction.rawLabel.toLowerCase().includes(search.toLowerCase()) ||
          transaction.merchantName.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryId === "all" || transaction.categoryId === categoryId;

        return matchesSearch && matchesCategory;
      }),
    [categoryId, search, transactions]
  );

  return (
    <Screen title="Transactions" subtitle={`${filtered.length} operations visibles`}>
      <View style={styles.filters}>
        <TextField label="Recherche" value={search} onChangeText={setSearch} placeholder="Marchand, libelle..." />
        <PickerField
          label="Categorie"
          selectedValue={categoryId}
          onValueChange={setCategoryId}
          items={[
            { label: "Toutes", value: "all" },
            ...CATEGORY_DEFINITIONS.map((category) => ({ label: category.label, value: category.id }))
          ]}
        />
      </View>

      {filtered.length ? (
        <View style={styles.list}>
          {filtered.map((transaction) => (
            <TransactionListItem
              key={transaction.id}
              transaction={transaction}
              onPress={() =>
                router.push({
                  pathname: "/(app)/transaction",
                  params: { id: transaction.id }
                })
              }
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title="Aucune transaction"
          description="Ajoute une source de donnees ou ajuste les filtres pour voir des operations."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: spacing.md
  },
  list: {
    gap: spacing.md
  }
});
