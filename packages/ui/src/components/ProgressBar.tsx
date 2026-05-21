import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme/tokens";

export const ProgressBar = ({
  label,
  value,
  total,
  color = colors.accent
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) => {
  const ratio = total === 0 ? 0 : Math.min(value / total, 1);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.metric}>
          {value.toFixed(0)} / {total.toFixed(0)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  metric: {
    color: colors.textMuted,
    fontSize: 13
  },
  track: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    height: 10,
    overflow: "hidden"
  },
  fill: {
    borderRadius: radii.sm,
    height: "100%"
  }
});
