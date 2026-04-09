import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { cached, enqueueWrite, invalidateCache } from "@/lib/cache";
import { dailyPlan as dailyPlanApi } from "@/lib/api";
import { CycleAlertsCard } from "@/components/today/CycleAlertsCard";
import { DailyPlanWindowCard } from "@/components/today/DailyPlanWindowCard";
import { InteractionWarningsCard } from "@/components/today/InteractionWarningsCard";
import { NutritionPhaseCard } from "@/components/today/NutritionPhaseCard";
import { SkincareGuidanceCard } from "@/components/today/SkincareGuidanceCard";
import { TrackingSummaryCard } from "@/components/today/TrackingSummaryCard";
import { TodayDateHeader } from "@/components/today/TodayDateHeader";
import { getTodayIsoDate, shiftIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";
import { tracking as trackingApi } from "@/lib/api";
import type { DailyPlan, TrackingOverview } from "@/lib/api";

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [trackingOverview, setTrackingOverview] = useState<TrackingOverview | null>(null);
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
      const [planResult, trackingResult] = await Promise.allSettled([
        cached(`daily-plan:${date}`, () => dailyPlanApi.get(date), 15 * 60 * 1000),
        cached(`tracking:${date}`, () => trackingApi.overview({ days: 14, endDate: date }), 30 * 60 * 1000),
      ]);

      if (planResult.status === "rejected") {
        throw planResult.reason;
      }

      setPlan(planResult.value);
      if (trackingResult.status === "fulfilled") {
        setTrackingOverview(trackingResult.value);
      } else {
        showError("Failed to load tracking overview");
        setTrackingOverview(null);
      }
    } catch (error) {
      showError("Failed to load daily plan");
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const interactionWarnings = plan?.interactions ?? [];
  const cycleAlerts = plan?.cycle_alerts ?? [];
  const nutritionPhase = plan?.nutrition_phase ?? null;
  const skincareGuidance = plan?.skincare_guidance ?? null;
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

      <TrackingSummaryCard overview={trackingOverview} endDate={selectedDate} />
      <NutritionPhaseCard phase={nutritionPhase} />
      <SkincareGuidanceCard guidance={skincareGuidance} />
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
              const adherenceByType: Record<string, typeof dailyPlanApi.updateSupplementAdherence> = {
                supplement: dailyPlanApi.updateSupplementAdherence,
                medication: dailyPlanApi.updateMedicationAdherence,
                therapy: dailyPlanApi.updateTherapyAdherence,
                peptide: dailyPlanApi.updatePeptideAdherence,
              };
              const updateAdherence = adherenceByType[item.type] ?? dailyPlanApi.updateSupplementAdherence;
              try {
                await updateAdherence(item.id, {
                  status,
                  date: selectedDate,
                });
              } catch {
                // Offline — queue the write for later
                const typePathMap: Record<string, string> = {
                  supplement: "supplements",
                  medication: "medications",
                  therapy: "therapies",
                  peptide: "peptides",
                };
                const typePath = typePathMap[item.type] ?? "supplements";
                await enqueueWrite({
                  path: `/api/v1/users/me/adherence/${typePath}/${item.id}`,
                  method: "POST",
                  body: JSON.stringify({ status, date: selectedDate }),
                });
              }
              // Invalidate cache so next fetch gets fresh data
              await invalidateCache(`daily-plan:${selectedDate}`);
              await loadPlan(selectedDate, true);
            } catch (error) {
              showError("Failed to update adherence");
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
    backgroundColor: colors.backgroundSecondary,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
