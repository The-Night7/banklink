import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Chip, Screen, colors, radii, spacing } from "@budgetlink/ui";

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
      subtitle="Budget personnel web et mobile avec synchronisation bancaire, budgets, objectifs et historique consolide."
    >
      <Card>
        <View style={styles.hero}>
          <View style={styles.heroBand} />
          <Text style={styles.heroTitle}>Tous tes flux financiers dans une seule vue claire.</Text>
          <Text style={styles.heroCopy}>
            Connexion banque France/UE, classification des depenses, graphiques, budgets mensuels et objectifs d'epargne.
          </Text>
          <View style={styles.badges}>
            <Chip label="Firebase" tone="success" />
            <Chip label="Powens / CSV" tone="success" />
            <Chip label="Web + mobile" tone="success" />
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.modeSwitcher}>
          <Pressable
            onPress={() => setMode("sign-in")}
            style={[styles.modeButton, mode === "sign-in" ? styles.modeButtonActive : null]}
          >
            <Text style={[styles.modeLabel, mode === "sign-in" ? styles.modeLabelActive : null]}>Connexion</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("sign-up")}
            style={[styles.modeButton, mode === "sign-up" ? styles.modeButtonActive : null]}
          >
            <Text style={[styles.modeLabel, mode === "sign-up" ? styles.modeLabelActive : null]}>Creation de compte</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.eyebrow}>{mode === "sign-in" ? "Acces utilisateur" : "Profil initial"}</Text>
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

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <ActionButton label="Continuer avec Google" onPress={submitGoogle} variant="secondary" disabled={loading} />
          <Text style={styles.helper}>
            Si Google echoue, verifie dans Firebase Auth que le provider Google est active et que ton domaine de deploiement est autorise.
          </Text>

          <View style={styles.benefits}>
            <Text style={styles.benefitTitle}>Ce que tu obtiens ensuite</Text>
            <Text style={styles.benefitItem}>Dashboard revenus, depenses, epargne nette et soldes agreges.</Text>
            <Text style={styles.benefitItem}>Historique des transactions avec recategorisation et regles marchand.</Text>
            <Text style={styles.benefitItem}>Budgets mensuels et objectifs d'epargne avec progression visuelle.</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md
  },
  heroBand: {
    backgroundColor: colors.accentStrong,
    borderRadius: 999,
    height: 10,
    width: 112
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34
  },
  heroCopy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  modeSwitcher: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.xs
  },
  modeButton: {
    alignItems: "center",
    borderRadius: radii.sm,
    flex: 1,
    paddingVertical: spacing.sm
  },
  modeButtonActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
  },
  modeLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700"
  },
  modeLabelActive: {
    color: colors.text
  },
  form: {
    gap: spacing.md
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  separator: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  separatorLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1
  },
  separatorText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  benefits: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md
  },
  benefitTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  benefitItem: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
