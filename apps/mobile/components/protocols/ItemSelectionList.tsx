import type { Dispatch, SetStateAction } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

export interface SelectableItem {
  id: string;
  title: string;
  meta: string;
  submeta?: string;
  is_active: boolean;
}

export function ItemSelectionList<T extends SelectableItem>({
  title,
  helperText,
  items,
  selectedIds,
  onToggle,
}: {
  title: string;
  helperText: string;
  items: T[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.selectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.selectionCount}>{selectedIds.length} selected</Text>
      </View>
      <Text style={styles.helperText}>{helperText}</Text>

      <View style={styles.optionList}>
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          const lockedInactive = !item.is_active && !selected;
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.optionRow,
                selected && styles.optionRowSelected,
                lockedInactive && styles.optionRowDisabled,
                pressed && !lockedInactive && styles.pressed,
              ]}
              onPress={() => {
                if (!lockedInactive) onToggle(item.id);
              }}
              accessibilityRole="checkbox"
              accessibilityLabel={item.title}
              accessibilityState={{ checked: selected, disabled: lockedInactive }}
            >
              <View style={styles.optionInfo}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  {!item.is_active ? (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Inactive</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.optionMeta}>{item.meta}</Text>
                {item.submeta ? <Text style={styles.optionSubmeta}>{item.submeta}</Text> : null}
              </View>
              <FontAwesome
                name={selected ? "check-square-o" : "square-o"}
                size={20}
                color={selected ? colors.primary : colors.textPlaceholder}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.grayDark,
    marginBottom: 12,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
    marginBottom: 12,
  },
  optionList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(240,244,248,0.82)",
  },
  optionRowSelected: {
    borderColor: colors.infoSelect,
    backgroundColor: colors.primaryLight,
  },
  optionRowDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  optionMeta: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  optionSubmeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  inactiveBadge: {
    backgroundColor: colors.badgeYellowLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.badgeYellowBorder,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warningDark,
  },
});
