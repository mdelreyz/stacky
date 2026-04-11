import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { ExerciseHero } from "@/components/exercise/ExerciseHero";
import { ExerciseNavLinksSection } from "@/components/exercise/ExerciseNavLinksSection";
import { ExerciseRecentSessionsSection } from "@/components/exercise/ExerciseRecentSessionsSection";
import { ExerciseRoutinesSection } from "@/components/exercise/ExerciseRoutinesSection";
import {
  exerciseRegimes as regimesApi,
  exerciseStats as statsApi,
  workoutRoutines as routinesApi,
  workoutSessions as sessionsApi,
} from "@/lib/api";
import { useGymArrival } from "@/lib/gym-geofence";
import { showError } from "@/lib/errors";
import type {
  ExerciseStatsOverview,
  WorkoutRoutine,
  WorkoutRoutineListItem,
  WorkoutSessionListItem,
} from "@/lib/api";

export default function ExerciseScreen() {
  const router = useRouter();
  const { match: gymMatch, recheck: recheckGym } = useGymArrival();
  const [todayRoutines, setTodayRoutines] = useState<WorkoutRoutine[]>([]);
  const [recentSessions, setRecentSessions] = useState<WorkoutSessionListItem[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutineListItem[]>([]);
  const [stats, setStats] = useState<ExerciseStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [todayRes, sessionsRes, routinesRes, statsRes] = await Promise.all([
        regimesApi.today().catch(() => [] as WorkoutRoutine[]),
        sessionsApi.list({ page_size: 5 } as any).catch(() => ({ items: [] })),
        routinesApi.list({ active_only: true }).catch(() => ({ items: [] })),
        statsApi.overview().catch(() => null),
      ]);
      setTodayRoutines(todayRes);
      setRecentSessions(sessionsRes.items);
      setRoutines(routinesRes.items);
      setStats(statsRes);
    } catch (error) {
      showError("Failed to load exercise data");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
      recheckGym();
    }, [loadData, recheckGym])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const thisWeek = stats?.weekly_summary?.[stats.weekly_summary.length - 1];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AmbientBackdrop />
      <FadeInView>
        <ExerciseHero
          sessionCount={thisWeek?.sessions}
          gymMatch={gymMatch}
          onPressGymBanner={() => {
            if (!gymMatch?.matched || !gymMatch.gym_location) {
              return;
            }
            if (gymMatch.default_routine) {
              router.push(`/workout-session/start?routine_id=${gymMatch.default_routine.id}`);
            } else {
              router.push("/workout-session/start");
            }
          }}
        />

        {/* Today's Workout */}
        {todayRoutines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Workout</Text>
            {todayRoutines.map((routine) => (
              <Pressable
                key={routine.id}
                style={({ pressed }) => [styles.todayCard, pressed && styles.pressedCard]}
                accessibilityRole="button"
                accessibilityLabel={`Start ${routine.name}`}
                onPress={() => router.push(`/workout-session/start?routine_id=${routine.id}`)}
              >
                <View style={styles.todayCardContent}>
                  <FontAwesome name="play-circle" size={28} color={colors.primary} />
                  <View style={styles.todayCardText}>
                    <Text style={styles.todayCardTitle}>{routine.name}</Text>
                    <Text style={styles.todayCardSub}>
                      {routine.exercises.length} exercises
                      {routine.estimated_duration_minutes
                        ? ` \u00b7 ~${routine.estimated_duration_minutes} min`
                        : ""}
                    </Text>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        {thisWeek && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{thisWeek.sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{thisWeek.total_sets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {thisWeek.total_volume >= 1000
                    ? `${(thisWeek.total_volume / 1000).toFixed(1)}k`
                    : Math.round(thisWeek.total_volume)}
                </Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{thisWeek.total_reps}</Text>
                <Text style={styles.statLabel}>Reps</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Start Workout"
              onPress={() => router.push("/workout-session/start")}
            >
              <FontAwesome name="plus" size={18} color={colors.textWhite} />
              <Text style={styles.actionBtnText}>Start Workout</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtnSecondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="New Routine"
              onPress={() => router.push("/workout-routine/create")}
            >
              <FontAwesome name="list-ol" size={16} color={colors.primary} />
              <Text style={styles.actionBtnTextSecondary}>New Routine</Text>
            </Pressable>
          </View>
        </View>

        <ExerciseRoutinesSection
          routines={routines}
          onCreateRoutine={() => router.push("/workout-routine/create")}
          onOpenRoutine={(routineId) => router.push(`/workout-routine/${routineId}`)}
        />

        <ExerciseRecentSessionsSection
          sessions={recentSessions}
          onOpenSession={(sessionId) => router.push(`/workout-session/${sessionId}`)}
        />

        <ExerciseNavLinksSection
          onOpenStats={() => router.push("/exercise/stats")}
          onManageRegimes={() => router.push("/exercise-regime/create")}
          onManageGyms={() => router.push("/gym-location/manage")}
          onCreateCustomExercise={() => router.push("/exercise/create")}
        />

      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },

  // Today card
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  todayCardContent: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  todayCardText: { flex: 1 },
  todayCardTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  todayCardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  // Stats
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Actions
  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: colors.textWhite },
  actionBtnSecondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  actionBtnTextSecondary: { fontSize: 15, fontWeight: "600", color: colors.primary },

  pressedCard: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.992 }],
    backgroundColor: "rgba(255,255,255,0.88)",
  },
});
