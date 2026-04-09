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
              style={[
                styles.optionRow,
                selected && styles.optionRowSelected,
                lockedInactive && styles.optionRowDisabled,
              ]}
              onPress={() => {
                if (!lockedInactive) onToggle(item.id);
              }}
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
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.backgroundSecondary,
  },
  optionRowSelected: {
    borderColor: "#74c0fc",
    backgroundColor: colors.primaryLight,
  },
  optionRowDisabled: {
    opacity: 0.55,
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
    backgroundColor: "#fff3bf",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8f5b00",
  },
});
