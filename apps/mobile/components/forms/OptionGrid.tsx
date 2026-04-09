import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";

export function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.chip, selected === option.value && styles.chipSelected]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={[styles.chipText, selected === option.value && styles.chipTextSelected]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: "#d0ebff",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primaryDarker,
  },
});
