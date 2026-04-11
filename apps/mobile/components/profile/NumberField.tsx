import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/Colors";

type NumberFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
};

export function NumberField({ label, value, onChangeText }: NumberFieldProps) {
  return (
    <View style={styles.numberFieldRow}>
      <Text style={styles.numberFieldLabel}>{label}</Text>
      <TextInput
        style={styles.numberFieldInput}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder="—"
        placeholderTextColor={colors.textPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  numberFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,236,242,0.74)",
  },
  numberFieldLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  numberFieldInput: {
    width: 64,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(248,251,255,0.84)",
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
