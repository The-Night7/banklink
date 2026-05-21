import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radii, spacing } from "@budgetlink/ui";

export const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  multiline = false
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  multiline?: boolean;
}) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      multiline={multiline}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secureTextEntry}
      style={[styles.input, multiline ? styles.multiline : null]}
      value={value}
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top"
  }
});
