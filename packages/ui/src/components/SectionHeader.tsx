import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

export const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700"
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
