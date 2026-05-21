import { StyleSheet, Text, View } from "react-native";

import { Card, Screen, SectionHeader, colors, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../../src/components/ActionButton";
import { useAuth } from "../../../src/lib/auth";

export default function SettingsScreen() {
  const { profile, signOutUser } = useAuth();

  return (
    <Screen title="Reglages" subtitle="Profil, connexions et preferences de base">
      <Card>
        <SectionHeader title="Profil" />
        <View style={styles.stack}>
          <Text style={styles.label}>{profile?.displayName ?? "Utilisateur BudgetLink"}</Text>
          <Text style={styles.caption}>{profile?.email ?? ""}</Text>
          <Text style={styles.caption}>
            {profile?.locale ?? "fr-FR"} · {profile?.currency ?? "EUR"}
          </Text>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Session" description="Deconnexion locale Firebase Auth" />
        <View style={styles.stack}>
          <ActionButton label="Se deconnecter" onPress={signOutUser} variant="secondary" />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  label: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13
  }
});
