import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, spacing } from "@budgetlink/ui";

export const ActionButton = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false
}: {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}) => {
  const palette =
    variant === "secondary"
      ? { background: colors.surfaceAlt, text: colors.text }
      : variant === "ghost"
        ? { background: "transparent", text: colors.textMuted }
        : { background: colors.accentStrong, text: "#FFFFFF" };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => void onPress()}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        {
          backgroundColor: palette.background,
          opacity: pressed || disabled ? 0.72 : 1,
          borderWidth: variant === "ghost" ? 0 : 1,
          borderColor: variant === "secondary" ? colors.border : palette.background
        }
      ]}
    >
      {loading ? <ActivityIndicator color={palette.text} /> : <Text style={[styles.label, { color: palette.text }]}>{label}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  label: {
    fontSize: 15,
    fontWeight: "700"
  }
});
