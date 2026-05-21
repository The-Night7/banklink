import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Screen, colors, radii, spacing } from "@budgetlink/ui";

import { ActionButton } from "../../src/components/ActionButton";
import { TextField } from "../../src/components/TextField";
import { useAuth } from "../../src/lib/auth";

export default function SignInScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { authFeedback, clearAuthFeedback, signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();

  const submit = async () => {
    try {
      setLoading(true);
      clearAuthFeedback();
      if (mode === "sign-in") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
    } catch (error) {
      if (Platform.OS !== "web") {
        Alert.alert("Connexion impossible", error instanceof Error ? error.message : "Erreur inconnue");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    try {
      setLoading(true);
      clearAuthFeedback();
      await signInWithGoogle();
    } catch (error) {
      if (Platform.OS !== "web") {
        Alert.alert("Google indisponible", error instanceof Error ? error.message : "Configuration manquante");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="BudgetLink"
      subtitle="Budget personnel web et mobile avec synchronisation bancaire, budgets, objectifs et historique consolide."
    >
      <Card padded={false}>
        <View style={styles.heroShell}>
          <View style={styles.heroGlow} />
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>Bienvenue dans BudgetLink</Text>
            <Text style={styles.heroTitle}>Ton budget devient lisible des le premier coup d'oeil.</Text>
            <Text style={styles.heroCopy}>
              Connecte ta banque, suis tes depenses en direct et garde une vue sereine sur tes objectifs d'epargne.
            </Text>
            <View style={styles.badges}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Firebase securise</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Powens + CSV</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Web + mobile</Text>
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>Unifie</Text>
                <Text style={styles.heroStatLabel}>comptes, flux et objectifs</Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>Auto</Text>
                <Text style={styles.heroStatLabel}>classement des depenses</Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>Clair</Text>
                <Text style={styles.heroStatLabel}>graphiques et budgets vivants</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.modeSwitcher}>
          <Pressable
            onPress={() => {
              clearAuthFeedback();
              setMode("sign-in");
            }}
            style={[styles.modeButton, mode === "sign-in" ? styles.modeButtonActive : null]}
          >
            <Text style={[styles.modeLabel, mode === "sign-in" ? styles.modeLabelActive : null]}>Connexion</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              clearAuthFeedback();
              setMode("sign-up");
            }}
            style={[styles.modeButton, mode === "sign-up" ? styles.modeButtonActive : null]}
          >
            <Text style={[styles.modeLabel, mode === "sign-up" ? styles.modeLabelActive : null]}>Creation de compte</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.eyebrow}>{mode === "sign-in" ? "Entre dans ton espace" : "Cree ton espace budget"}</Text>
          <Text style={styles.formTitle}>
            {mode === "sign-in" ? "Retrouve tes tableaux, comptes et objectifs." : "Demarre avec un profil simple, puis connecte ta banque."}
          </Text>
          <Text style={styles.formCopy}>
            {mode === "sign-in"
              ? "Email ou Google fonctionnent sur le web. Si ton navigateur bloque la fenetre Google, BudgetLink basculera sur une redirection."
              : "Le compte est cree en quelques secondes et tu pourras ensuite activer la synchronisation bancaire ou importer un CSV."}
          </Text>

          {authFeedback ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>Connexion Google a verifier</Text>
              <Text style={styles.feedbackBody}>{authFeedback}</Text>
            </View>
          ) : null}

          {mode === "sign-up" ? (
            <TextField
              label="Nom affiche"
              value={displayName}
              onChangeText={(value) => {
                clearAuthFeedback();
                setDisplayName(value);
              }}
              placeholder="Camille Martin"
            />
          ) : null}
          <TextField
            label="Email"
            value={email}
            onChangeText={(value) => {
              clearAuthFeedback();
              setEmail(value);
            }}
            placeholder="camille@budgetlink.app"
            keyboardType="email-address"
          />
          <TextField
            label="Mot de passe"
            value={password}
            onChangeText={(value) => {
              clearAuthFeedback();
              setPassword(value);
            }}
            placeholder="8 caracteres minimum"
            secureTextEntry
          />
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
            Si Google refuse encore la connexion, active le provider Google dans Firebase Auth et ajoute `localhost` ainsi que ton domaine Vercel dans les domaines autorises.
          </Text>

          <View style={styles.benefits}>
            <Text style={styles.benefitTitle}>Une fois connecte</Text>
            <Text style={styles.benefitItem}>Vue d'ensemble des revenus, depenses, epargne nette et soldes regroupes.</Text>
            <Text style={styles.benefitItem}>Historique avec recategorisation, filtres et regles marchand reutilisables.</Text>
            <Text style={styles.benefitItem}>Budgets mensuels et objectifs d'epargne avec progression visuelle continue.</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroShell: {
    backgroundColor: colors.accentStrong,
    borderRadius: radii.md,
    overflow: "hidden",
    position: "relative"
  },
  heroGlow: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 240,
    opacity: 0.28,
    position: "absolute",
    right: -72,
    top: -96,
    width: 240
  },
  hero: {
    gap: spacing.md,
    padding: spacing.lg
  },
  heroEyebrow: {
    color: "#D1FAE5",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 36,
    maxWidth: 540
  },
  heroCopy: {
    color: "#E7F6F4",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 560
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  heroPill: {
    backgroundColor: "rgba(255, 253, 248, 0.14)",
    borderColor: "rgba(255, 253, 248, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10
  },
  heroPillText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700"
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  heroStatCard: {
    backgroundColor: "rgba(255, 253, 248, 0.92)",
    borderRadius: radii.sm,
    gap: 4,
    minWidth: 148,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  heroStatValue: {
    color: colors.accentStrong,
    fontSize: 18,
    fontWeight: "800"
  },
  heroStatLabel: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17
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
  formTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 30
  },
  formCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  feedbackCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  feedbackTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "800"
  },
  feedbackBody: {
    color: "#7F1D1D",
    fontSize: 14,
    lineHeight: 20
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
    backgroundColor: "#F0F7F6",
    borderColor: "#CDE5E2",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  benefitTitle: {
    color: colors.accentStrong,
    fontSize: 15,
    fontWeight: "800"
  },
  benefitItem: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
