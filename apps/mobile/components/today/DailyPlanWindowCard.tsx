import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DailyPlanItem, TakeWindowPlan } from "@/lib/api";

export function DailyPlanWindowCard({
  windowPlan,
  pendingActionItemId,
  onUpdateAdherence,
}: {
  windowPlan: TakeWindowPlan;
  pendingActionItemId: string | null;
  onUpdateAdherence: (item: DailyPlanItem, status: "taken" | "skipped") => Promise<void>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{windowPlan.display_time}</Text>
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
              onUpdate={(status) => onUpdateAdherence(item, status)}
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
  onUpdate,
}: {
  item: DailyPlanItem;
  loading: boolean;
  onUpdate: (status: "taken" | "skipped") => Promise<void>;
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
        onPress={() => void onUpdate("taken")}
        disabled={loading}
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
        onPress={() => void onUpdate("skipped")}
        disabled={loading}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </Pressable>
    </View>
  );
}

function StatusPill({ status }: { status: "pending" | "taken" | "skipped" }) {
  const stylesByStatus = {
    pending: { backgroundColor: "#e7f5ff", color: "#1c7ed6", label: "Pending" },
    taken: { backgroundColor: "#ebfbee", color: "#2b8a3e", label: "Taken" },
    skipped: { backgroundColor: "#fff5f5", color: "#c92a2a", label: "Skipped" },
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
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: "#adb5bd",
  },
  hint: {
    fontSize: 13,
    color: "#868e96",
    marginTop: 8,
    fontStyle: "italic",
  },
  itemCard: {
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
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
    color: "#212529",
  },
  itemDetails: {
    fontSize: 13,
    color: "#1c7ed6",
    marginTop: 4,
    fontWeight: "600",
  },
  itemInstructions: {
    fontSize: 13,
    color: "#495057",
    marginTop: 4,
    lineHeight: 18,
  },
  itemRegimes: {
    fontSize: 12,
    color: "#6c757d",
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
    borderColor: "#2b8a3e",
  },
  takeButton: {
    backgroundColor: "#ebfbee",
  },
  takeButtonText: {
    color: "#2b8a3e",
    fontSize: 13,
    fontWeight: "700",
  },
  skipButton: {
    backgroundColor: "#fff5f5",
  },
  skipButtonActive: {
    borderWidth: 1,
    borderColor: "#c92a2a",
  },
  skipButtonText: {
    color: "#c92a2a",
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
