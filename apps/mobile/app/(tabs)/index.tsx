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
import { DailyPlanWindowCard } from "@/components/today/DailyPlanWindowCard";
import { InteractionWarningsCard } from "@/components/today/InteractionWarningsCard";
import { TodayDateHeader } from "@/components/today/TodayDateHeader";
import { getTodayIsoDate, shiftIsoDate } from "@/lib/date";
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

      <InteractionWarningsCard warnings={interactionWarnings} />

      {windows.map((windowPlan) => (
        <DailyPlanWindowCard
          key={windowPlan.window}
          windowPlan={windowPlan}
          pendingActionItemId={pendingActionItemId}
          onUpdateSupplementAdherence={async (itemId, status) => {
            setPendingActionItemId(itemId);
            try {
              await dailyPlanApi.updateSupplementAdherence(itemId, {
                status,
                date: selectedDate,
              });
              await loadPlan(selectedDate, true);
            } catch (error) {
              console.error("Failed to update supplement adherence", error);
            } finally {
              setPendingActionItemId((current) => (current === itemId ? null : current));
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
