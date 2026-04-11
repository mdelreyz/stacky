import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";
import { snakeCaseToLabel } from "@/lib/format";
import type { RecommendedItem } from "@/lib/api";

type RecommendationCardProps = {
  item: RecommendedItem;
  selected: boolean;
  onToggle: () => void;
};

const TYPE_ICONS: Record<string, string> = {
  supplement: "flask",
  medication: "medkit",
  therapy: "heartbeat",
  peptide: "eyedropper",
};

export function RecommendationCard({ item, selected, onToggle }: RecommendationCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.recCard,
        selected && styles.recCardSelected,
        pressed && styles.softPressed,
      ]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={`${item.name}, ${snakeCaseToLabel(item.item_type)}`}
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.recHeader}>
        <FontAwesome
          name={(TYPE_ICONS[item.item_type] ?? "circle") as any}
          size={14}
          color={selected ? colors.primary : colors.textMuted}
        />
        <Text style={styles.recName}>{item.name}</Text>
        <FontAwesome
          name={selected ? "check-square-o" : "square-o"}
          size={20}
          color={selected ? colors.primary : colors.border}
        />
      </View>
      <View style={styles.recBadgeRow}>
        <View style={styles.recBadge}>
          <Text style={styles.recBadgeText}>{snakeCaseToLabel(item.item_type)}</Text>
        </View>
        <View style={styles.recBadge}>
          <Text style={styles.recBadgeText}>{snakeCaseToLabel(item.category)}</Text>
        </View>
        <View style={[styles.recBadge, styles.rankBadge]}>
          <Text style={styles.rankBadgeText}>#{item.priority_rank}</Text>
        </View>
      </View>
      <Text style={styles.recReason}>{item.reason}</Text>
      {(item.suggested_dosage || item.suggested_window) && (
        <Text style={styles.recMeta}>
          {[
            item.suggested_dosage && `Dosage: ${item.suggested_dosage}`,
            item.suggested_window && `Window: ${snakeCaseToLabel(item.suggested_window)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  recCardSelected: {
    borderColor: "rgba(104,138,160,0.34)",
    backgroundColor: "rgba(246,249,252,0.9)",
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  recBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  recBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(243,247,251,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  recBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  rankBadge: {
    backgroundColor: "rgba(234,242,248,0.94)",
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  recReason: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  softPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
