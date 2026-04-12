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
import { APIError, dailyPlan as dailyPlanApi } from "@/lib/api";
import { CycleAlertsCard } from "@/components/today/CycleAlertsCard";
import { DailyPlanWindowCard } from "@/components/today/DailyPlanWindowCard";
import { EmptyDayCard } from "@/components/today/EmptyDayCard";
import { InteractionWarningsCard } from "@/components/today/InteractionWarningsCard";
import { JournalPromptCard } from "@/components/today/JournalPromptCard";
import { NutritionPhaseCard } from "@/components/today/NutritionPhaseCard";
import { SkincareGuidanceCard } from "@/components/today/SkincareGuidanceCard";
import { SkipReasonModal } from "@/components/today/SkipReasonModal";
import { TodayExerciseCard } from "@/components/today/TodayExerciseCard";
import { GoalProgressCard } from "@/components/today/GoalProgressCard";
import { TrackingSummaryCard } from "@/components/today/TrackingSummaryCard";
import { WeeklyDigestCard } from "@/components/today/WeeklyDigestCard";
import { TodayDateHeader } from "@/components/today/TodayDateHeader";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { getTodayIsoDate, shiftIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";
import { tracking as trackingApi } from "@/lib/api";
import type { DailyPlan, DailyPlanItem, TrackingOverview } from "@/lib/api";

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [trackingOverview, setTrackingOverview] = useState<TrackingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingActionItemId, setPendingActionItemId] = useState<string | null>(null);
  const [skipModalItem, setSkipModalItem] = useState<DailyPlanItem | null>(null);

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
        setTrackingOverview(null);
        if (refresh) {
          showError("Failed to refresh tracking overview");
        }
      }
    } catch (error) {
      if (!(error instanceof APIError && (error.status === 401 || error.status === 403))) {
        showError("Failed to load daily plan");
      }
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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void loadPlan(selectedDate, true)} />
      }
    >
      <AmbientBackdrop />
      <FadeInView>
        <TodayDateHeader
          selectedDate={selectedDate}
          onChangeDay={(delta) => setSelectedDate((current) => shiftIsoDate(current, delta))}
          onJumpToToday={() => setSelectedDate(getTodayIsoDate())}
        />

        <TrackingSummaryCard overview={trackingOverview} endDate={selectedDate} />
        <WeeklyDigestCard />
        <GoalProgressCard />
        <JournalPromptCard date={selectedDate} />
        <TodayExerciseCard items={plan?.exercise_plan ?? []} />
        <NutritionPhaseCard phase={nutritionPhase} />
        <SkincareGuidanceCard guidance={skincareGuidance} />
        <CycleAlertsCard alerts={cycleAlerts} />
        <InteractionWarningsCard warnings={interactionWarnings} />

        {windows.length === 0 && <EmptyDayCard />}

        {windows.map((windowPlan) => (
          <DailyPlanWindowCard
            key={windowPlan.window}
            windowPlan={windowPlan}
            pendingActionItemId={pendingActionItemId}
            onRequestSkip={(item) => setSkipModalItem(item)}
            onUpdateAdherence={async (item, status, skipReason?) => {
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
                    ...(skipReason ? { skip_reason: skipReason } : {}),
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
                    body: JSON.stringify({ status, date: selectedDate, ...(skipReason ? { skip_reason: skipReason } : {}) }),
                  });
                }
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
      </FadeInView>

      <SkipReasonModal
        visible={skipModalItem !== null}
        itemName={skipModalItem?.name ?? ""}
        onCancel={() => setSkipModalItem(null)}
        onConfirm={async (reason) => {
          if (!skipModalItem) return;
          const item = skipModalItem;
          setSkipModalItem(null);
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
                status: "skipped",
                date: selectedDate,
                ...(reason ? { skip_reason: reason } : {}),
              });
            } catch {
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
                body: JSON.stringify({ status: "skipped", date: selectedDate, ...(reason ? { skip_reason: reason } : {}) }),
              });
            }
            await invalidateCache(`daily-plan:${selectedDate}`);
            await loadPlan(selectedDate, true);
          } catch (error) {
            showError("Failed to skip item");
          } finally {
            setPendingActionItemId((current) => (current === item.id ? null : current));
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    paddingBottom: 28,
    position: "relative",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
