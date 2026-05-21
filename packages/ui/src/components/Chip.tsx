import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme/tokens";

export const Chip = ({ label, tone = "default" }: { label: string; tone?: "default" | "warning" | "danger" | "success" }) => {
  const palette =
    tone === "warning"
      ? { background: "#FEF3C7", text: colors.warning }
      : tone === "danger"
        ? { background: "#FEE2E2", text: colors.danger }
        : tone === "success"
          ? { background: "#DCFCE7", text: colors.success }
          : { background: colors.surfaceAlt, text: colors.textMuted };

  return (
    <View style={[styles.chip, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  }
});
