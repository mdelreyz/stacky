import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { dailyPlan as dailyPlanApi } from "@/lib/api";
import { CycleAlertsCard } from "@/components/today/CycleAlertsCard";
import { DailyPlanWindowCard } from "@/components/today/DailyPlanWindowCard";
import { InteractionWarningsCard } from "@/components/today/InteractionWarningsCard";
import { NutritionPhaseCard } from "@/components/today/NutritionPhaseCard";
import { TodayDateHeader } from "@/components/today/TodayDateHeader";
import { getTodayIsoDate, shiftIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";
import type { DailyPlan } from "@/lib/api";

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingActionItemId, setPendingActionItemId] = useState<string | null>(null);

  const loadPlan = useCallback(async (date: string, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const nextPlan = await dailyPlanApi.get(date);
      setPlan(nextPlan);
    } catch (error) {
      console.error("Failed to load daily plan", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlan(selectedDate);
    }, [loadPlan, selectedDate])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  const interactionWarnings = plan?.interactions ?? [];
  const cycleAlerts = plan?.cycle_alerts ?? [];
  const nutritionPhase = plan?.nutrition_phase ?? null;
  const windows = plan?.windows ?? [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void loadPlan(selectedDate, true)} />
      }
    >
      <TodayDateHeader
        selectedDate={selectedDate}
        onChangeDay={(delta) => setSelectedDate((current) => shiftIsoDate(current, delta))}
        onJumpToToday={() => setSelectedDate(getTodayIsoDate())}
      />

      <NutritionPhaseCard phase={nutritionPhase} />
      <CycleAlertsCard alerts={cycleAlerts} />
      <InteractionWarningsCard warnings={interactionWarnings} />

      {windows.map((windowPlan) => (
        <DailyPlanWindowCard
          key={windowPlan.window}
          windowPlan={windowPlan}
          pendingActionItemId={pendingActionItemId}
          onUpdateAdherence={async (item, status) => {
            setPendingActionItemId(item.id);
            try {
              const updateAdherence =
                item.type === "supplement"
                  ? dailyPlanApi.updateSupplementAdherence
                  : item.type === "medication"
                    ? dailyPlanApi.updateMedicationAdherence
                    : dailyPlanApi.updateTherapyAdherence;
              await updateAdherence(item.id, {
                status,
                date: selectedDate,
              });
              await loadPlan(selectedDate, true);
            } catch (error) {
              console.error("Failed to update adherence", error);
              showError("Failed to update completion status.");
            } finally {
              setPendingActionItemId((current) => (current === item.id ? null : current));
            }
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
