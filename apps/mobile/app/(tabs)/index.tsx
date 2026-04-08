import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { dailyPlan as dailyPlanApi } from "@/lib/api";
import type { DailyPlan, InteractionWarning } from "@/lib/api";

export default function TodayScreen() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlan = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const nextPlan = await dailyPlanApi.get();
      setPlan(nextPlan);
    } catch (error) {
      console.error("Failed to load daily plan", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  const interactionWarnings = plan?.interactions ?? [];
  const windows = plan?.windows ?? [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void loadPlan(true)} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <Text style={styles.title}>Your Protocol</Text>
      </View>

      {interactionWarnings.length > 0 ? (
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <FontAwesome name="exclamation-triangle" size={16} color="#c92a2a" />
            <Text style={styles.warningTitle}>Interaction Warnings</Text>
          </View>
          {interactionWarnings.map((warning, index) => (
            <InteractionRow key={`${warning.supplement_a}-${warning.supplement_b}-${index}`} warning={warning} />
          ))}
        </View>
      ) : null}

      {windows.map((windowPlan) => (
        <View key={windowPlan.window} style={styles.section}>
          <Text style={styles.sectionTitle}>{windowPlan.display_time}</Text>
          {windowPlan.items.length > 0 ? (
            windowPlan.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <StatusPill status={item.adherence_status} />
                </View>
                <Text style={styles.itemDosage}>{item.dosage}</Text>
                <Text style={styles.itemInstructions}>{item.instructions}</Text>
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
      ))}
    </ScrollView>
  );
}

function InteractionRow({ warning }: { warning: InteractionWarning }) {
  return (
    <View style={styles.warningRow}>
      <Text style={styles.warningPair}>
        {warning.supplement_a} + {warning.supplement_b}
      </Text>
      <Text style={styles.warningText}>{warning.description}</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  date: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
  },
  warningCard: {
    backgroundColor: "#fff5f5",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffe3e3",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#c92a2a",
  },
  warningRow: {
    marginTop: 8,
  },
  warningPair: {
    fontSize: 14,
    fontWeight: "600",
    color: "#862e2e",
  },
  warningText: {
    fontSize: 13,
    color: "#a61e4d",
    marginTop: 2,
    lineHeight: 18,
  },
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
  itemDosage: {
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
