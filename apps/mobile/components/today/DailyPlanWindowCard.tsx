import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { DailyPlanItem, TakeWindowPlan } from "@/lib/api";

export function DailyPlanWindowCard({
  windowPlan,
  pendingActionItemId,
  onUpdateAdherence,
  onRequestSkip,
}: {
  windowPlan: TakeWindowPlan;
  pendingActionItemId: string | null;
  onUpdateAdherence: (item: DailyPlanItem, status: "taken" | "skipped", skipReason?: string) => Promise<void>;
  onRequestSkip: (item: DailyPlanItem) => void;
}) {
  const [markingAll, setMarkingAll] = useState(false);
  const pendingItems = windowPlan.items.filter((i) => i.adherence_status === "pending");
  const hasPending = pendingItems.length > 0;

  const handleMarkAll = async () => {
    if (!hasPending || markingAll) return;
    setMarkingAll(true);
    try {
      await Promise.all(pendingItems.map((item) => onUpdateAdherence(item, "taken")));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{windowPlan.display_time}</Text>
        {hasPending && windowPlan.items.length > 1 && (
          <Pressable
            style={[styles.markAllButton, markingAll && styles.markAllDisabled]}
            onPress={handleMarkAll}
            disabled={markingAll}
            accessibilityRole="button"
            accessibilityLabel={`Mark all ${windowPlan.display_time} items as taken`}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <>
                <FontAwesome name="check-circle" size={13} color={colors.success} />
                <Text style={styles.markAllText}>Mark All</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
      {windowPlan.items.length > 0 ? (
        windowPlan.items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <StatusPill status={item.adherence_status} />
            </View>
            {item.details ? <Text style={styles.itemDetails}>{item.details}</Text> : null}
            {item.regimes.length > 0 ? (
              <Text style={styles.itemRegimes}>Regime: {item.regimes.join(", ")}</Text>
            ) : null}
            <Text style={styles.itemInstructions}>{item.instructions}</Text>
            <AdherenceActions
              item={item}
              loading={pendingActionItemId === item.id}
              onTake={() => void onUpdateAdherence(item, "taken")}
              onSkip={() => onRequestSkip(item)}
            />
          </View>
        ))
      ) : (
        <>
          <Text style={styles.placeholder}>Nothing scheduled in this window.</Text>
          {windowPlan.window === "morning_fasted" ? (
            <Text style={styles.hint}>
              Add supplements in the Protocols tab to populate your day.
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

function AdherenceActions({
  item,
  loading,
  onTake,
  onSkip,
}: {
  item: DailyPlanItem;
  loading: boolean;
  onTake: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.actionsRow}>
      <Pressable
        style={[
          styles.actionButton,
          styles.takeButton,
          loading && styles.actionButtonDisabled,
          item.adherence_status === "taken" && styles.actionButtonActive,
        ]}
        onPress={onTake}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${item.name} as taken`}
      >
        <Text style={styles.takeButtonText}>
          {loading && item.adherence_status !== "taken"
            ? "Saving..."
            : item.type === "therapy"
              ? "Complete"
              : item.type === "peptide"
                ? "Administer"
                : "Take"}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.actionButton,
          styles.skipButton,
          loading && styles.actionButtonDisabled,
          item.adherence_status === "skipped" && styles.skipButtonActive,
        ]}
        onPress={onSkip}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={`Skip ${item.name}`}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </Pressable>
    </View>
  );
}

function StatusPill({ status }: { status: "pending" | "taken" | "skipped" }) {
  const stylesByStatus = {
    pending: { backgroundColor: colors.primaryLight, color: colors.primaryDark, label: "Pending" },
    taken: { backgroundColor: colors.successLight, color: colors.success, label: "Taken" },
    skipped: { backgroundColor: colors.dangerLight, color: colors.dangerDark, label: "Skipped" },
  }[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: stylesByStatus.backgroundColor }]}>
      <Text style={[styles.statusText, { color: stylesByStatus.color }]}>
        {stylesByStatus.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllDisabled: {
    opacity: 0.6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  placeholder: {
    fontSize: 14,
    color: colors.textPlaceholder,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: "italic",
  },
  itemCard: {
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemDetails: {
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 4,
    fontWeight: "600",
  },
  itemInstructions: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  itemRegimes: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 6,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonActive: {
    borderWidth: 1,
    borderColor: colors.success,
  },
  takeButton: {
    backgroundColor: colors.successLight,
  },
  takeButtonText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700",
  },
  skipButton: {
    backgroundColor: colors.dangerLight,
  },
  skipButtonActive: {
    borderWidth: 1,
    borderColor: colors.dangerDark,
  },
  skipButtonText: {
    color: colors.dangerDark,
    fontSize: 13,
    fontWeight: "700",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
