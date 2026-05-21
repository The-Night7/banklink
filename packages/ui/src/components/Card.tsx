import type { PropsWithChildren } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "../theme/tokens";

type CardProps = PropsWithChildren<{
  padded?: boolean;
}>;

export const Card = ({ children, padded = true }: CardProps) => (
  <View style={[styles.card, padded ? styles.padded : null]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.05)" }
      : {
          elevation: 2,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 12
        })
  },
  padded: {
    padding: spacing.md
  }
});
