import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { colors, spacing } from "../theme/tokens";

export const StatCard = ({
  label,
  value,
  hint,
  accent = colors.accent
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) => (
  <Card>
    <View style={styles.container}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  accent: {
    borderRadius: 999,
    height: 6,
    width: 72
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600"
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700"
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13
  }
});
