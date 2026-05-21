import { createURL, openURL } from "expo-linking";
import { Platform, Alert, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { Card, Chip, EmptyState, Screen, SectionHeader, colors, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../../src/components/ActionButton";
import { useAccounts, useConnections } from "../../../src/hooks/use-budgetlink-data";
import { useAuth } from "../../../src/lib/auth";
import { importCsvWithStandardHeaders } from "../../../src/lib/data";
import {
  confirmCsvImport,
  createBankLinkSession,
  createCsvImportUpload,
  disconnectBankConnection,
  runManualSync
} from "../../../src/lib/functions";
import { formatCurrency } from "../../../src/lib/format";

export default function AccountsScreen() {
  const { user } = useAuth();
  const { data: accounts } = useAccounts();
  const { data: connections } = useConnections();
  const [pendingAction, setPendingAction] = useState<"connect" | "sync" | "csv" | null>(null);

  const connectBank = async () => {
    try {
      setPendingAction("connect");
      const session = await createBankLinkSession(createURL("/accounts"));
      await openURL(session.sessionUrl);
    } catch (error) {
      Alert.alert("Connexion bancaire impossible", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setPendingAction(null);
    }
  };

  const syncAll = async () => {
    try {
      setPendingAction("sync");
      await runManualSync();
      Alert.alert("Synchronisation lancee", "Le backend traite les operations connectees.");
    } catch (error) {
      Alert.alert("Sync impossible", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setPendingAction(null);
    }
  };

  const importCsv = async () => {
    if (!user) {
      return;
    }

    if (Platform.OS !== "web") {
      Alert.alert("Import CSV web", "Le flux CSV de cette V1 de code est prevu depuis le client web.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      try {
        setPendingAction("csv");
        await importCsvWithStandardHeaders({
          file,
          userId: user.uid,
          createCsvImportUpload,
          confirmCsvImport
        });
        Alert.alert("Import termine", "Le CSV a ete ajoute avec les en-tetes standard: date, amount, label, merchant, category.");
      } catch (error) {
        Alert.alert("Import impossible", error instanceof Error ? error.message : "Erreur inconnue");
      } finally {
        setPendingAction(null);
      }
    };
    input.click();
  };

  const disconnect = async (connectionId: string) => {
    try {
      await disconnectBankConnection(connectionId);
    } catch (error) {
      Alert.alert("Deconnexion impossible", error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  return (
    <Screen title="Comptes" subtitle="Connexions bancaires, soldes et import CSV de secours">
      <Card>
        <SectionHeader title="Actions" description="Connecte une banque Powens, relance une sync, ou importe un CSV standard." />
        <View style={styles.actions}>
          <ActionButton label="Connecter ma banque" onPress={connectBank} loading={pendingAction === "connect"} disabled={pendingAction !== null} />
          <ActionButton label="Synchroniser" onPress={syncAll} variant="secondary" loading={pendingAction === "sync"} disabled={pendingAction !== null} />
          <ActionButton label="Importer un CSV" onPress={importCsv} variant="secondary" loading={pendingAction === "csv"} disabled={pendingAction !== null} />
        </View>
        <Text style={styles.caption}>
          Retour Powens: `/accounts`. Format CSV V1: en-tetes `date`, `amount`, `label`, `merchant`, `category`, `account`.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Connexions" description="Etat des consentements et des synchronisations" />
        <View style={styles.list}>
          {connections.length ? (
            connections.map((connection) => (
              <View key={connection.id} style={styles.item}>
                <View style={styles.row}>
                  <Text style={styles.title}>{connection.institutionName}</Text>
                  <Chip
                    label={connection.status}
                    tone={
                      connection.status === "connected"
                        ? "success"
                        : connection.status === "attention" || connection.status === "pending"
                          ? "warning"
                          : "danger"
                    }
                  />
                </View>
                <Text style={styles.caption}>Derniere sync: {connection.lastSyncAt ?? "jamais"}</Text>
                {connection.syncError ? <Text style={styles.errorText}>{connection.syncError}</Text> : null}
                <ActionButton label="Deconnecter" onPress={() => disconnect(connection.id)} variant="ghost" />
              </View>
            ))
          ) : (
            <EmptyState
              title="Aucune connexion"
              description="Ajoute une banque France/UE via Powens ou importe un historique CSV."
            />
          )}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Comptes disponibles" description="Tous les comptes consolides dans BudgetLink" />
        <View style={styles.list}>
          {accounts.length ? (
            accounts.map((account) => (
              <View key={account.id} style={styles.item}>
                <Text style={styles.title}>{account.label}</Text>
                <Text style={styles.caption}>
                  {account.type} · {account.currency}
                </Text>
                <Text style={styles.balance}>{formatCurrency(account.currentBalance, account.currency)}</Text>
              </View>
            ))
          ) : (
            <EmptyState title="Aucun compte" description="Les comptes apparaitront ici apres la premiere synchronisation." />
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13
  },
  balance: {
    color: colors.accentStrong,
    fontSize: 22,
    fontWeight: "700"
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  }
});
