import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Card, Screen, colors, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../src/components/ActionButton";
import { TextField } from "../../src/components/TextField";
import { useAuth } from "../../src/lib/auth";

export default function SignInScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();

  const submit = async () => {
    try {
      setLoading(true);
      if (mode === "sign-in") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
    } catch (error) {
      Alert.alert("Connexion impossible", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert("Google indisponible", error instanceof Error ? error.message : "Configuration manquante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="BudgetLink"
      subtitle="Centralise tes comptes, ton historique, tes budgets et tes objectifs dans une seule app web et mobile."
    >
      <Card>
        <View style={styles.form}>
          <Text style={styles.eyebrow}>{mode === "sign-in" ? "Connexion" : "Creation de compte"}</Text>
          {mode === "sign-up" ? (
            <TextField
              label="Nom affiche"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Camille Martin"
            />
          ) : null}
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="camille@budgetlink.app" keyboardType="email-address" />
          <TextField label="Mot de passe" value={password} onChangeText={setPassword} placeholder="8 caracteres minimum" secureTextEntry />
          <ActionButton
            label={mode === "sign-in" ? "Se connecter" : "Creer mon compte"}
            onPress={submit}
            loading={loading}
          />
          <ActionButton label="Continuer avec Google" onPress={submitGoogle} variant="secondary" disabled={loading} />
          <ActionButton
            label={mode === "sign-in" ? "Je n'ai pas de compte" : "J'ai deja un compte"}
            onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            variant="ghost"
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  }
});
