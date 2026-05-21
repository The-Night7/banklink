import { Picker } from "@react-native-picker/picker";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "@budgetlink/ui";

export const PickerField = ({
  label,
  selectedValue,
  onValueChange,
  items
}: {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
}) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.shell}>
      <Picker selectedValue={selectedValue} onValueChange={(value: unknown) => onValueChange(`${value}`)}>
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
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
  shell: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: "hidden"
  }
});
