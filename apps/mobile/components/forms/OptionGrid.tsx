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
          style={({ pressed }) => [
            styles.chip,
            selected === option.value && styles.chipSelected,
            pressed && styles.pressed,
          ]}
          onPress={() => onSelect(option.value)}
          accessibilityRole="button"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: selected === option.value }}
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
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primaryDarker,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
});
