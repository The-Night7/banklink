import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Card, Chip, Screen, colors, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../src/components/ActionButton";
import { TextField } from "../../src/components/TextField";
import { useAuth } from "../../src/lib/auth";

export default function OnboardingScreen() {
  const { completeOnboarding, profile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? "");
  }, [profile?.displayName]);

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (profile?.onboardingCompleted) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const submit = async () => {
    try {
      setLoading(true);
      await completeOnboarding({
        displayName,
        locale: "fr-FR",
        currency: "EUR"
      });
    } catch (error) {
      Alert.alert("Profil incomplet", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Onboarding"
      subtitle="La V1 est pensee pour un usage personnel en EUR, avec connexion bancaire France/UE et import CSV de secours."
    >
      <Card>
        <View style={styles.stack}>
          <TextField label="Nom affiche" value={displayName} onChangeText={setDisplayName} placeholder="Camille" />
          <View style={styles.row}>
            <Chip label="Langue FR" tone="success" />
            <Chip label="Devise EUR" tone="success" />
            <Chip label="Usage perso" tone="success" />
          </View>
          <Text style={styles.copy}>
            Tu pourras connecter ta banque ou importer un CSV juste apres. Les categories, budgets, objectifs et graphiques seront ensuite calcules automatiquement.
          </Text>
          <ActionButton label="Entrer dans l'application" onPress={submit} loading={loading} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
