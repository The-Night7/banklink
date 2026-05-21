import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { colors, spacing } from "../theme/tokens";

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <Card>
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
