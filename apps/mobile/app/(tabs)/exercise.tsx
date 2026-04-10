import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
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
        <View style={styles.header}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Exercise</Text>
            <Text style={styles.subtitle}>
              Routines, live gym starts, session history, and weekly output in one calm control surface.
            </Text>
          </View>
          {thisWeek ? (
            <View style={styles.headerPill}>
              <Text style={styles.headerPillValue}>{thisWeek.sessions}</Text>
              <Text style={styles.headerPillLabel}>sessions</Text>
            </View>
          ) : null}
        </View>

      {/* Gym Arrival Banner */}
      {gymMatch?.matched && gymMatch.gym_location && (
        <Pressable
          style={({ pressed }) => [styles.gymBanner, pressed && styles.pressedCard]}
          accessibilityRole="button"
          accessibilityLabel={
            gymMatch.default_routine
              ? `You're at ${gymMatch.gym_location.name}. Tap to start ${gymMatch.default_routine.name}`
              : `You're at ${gymMatch.gym_location.name}. Tap to start a workout`
          }
          onPress={() => {
            if (gymMatch.default_routine) {
              router.push(`/workout-session/start?routine_id=${gymMatch.default_routine.id}`);
            } else {
              router.push("/workout-session/start");
            }
          }}
        >
          <FontAwesome name="map-marker" size={18} color={colors.textWhite} />
          <View style={{ flex: 1 }}>
            <Text style={styles.gymBannerTitle}>
              You're at {gymMatch.gym_location.name}
            </Text>
            <Text style={styles.gymBannerSub}>
              {gymMatch.default_routine
                ? `Tap to start ${gymMatch.default_routine.name}`
                : "Tap to start a workout"}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textWhite} />
        </Pressable>
      )}

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
            style={({ pressed }) => [styles.actionBtnSecondaryButton, pressed && styles.secondaryButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="New Routine"
            onPress={() => router.push("/workout-routine/create")}
          >
            <FontAwesome name="list-ol" size={16} color={colors.primary} />
            <Text style={styles.actionBtnTextSecondary}>New Routine</Text>
          </Pressable>
        </View>
      </View>

      {/* My Routines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Routines</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create new routine"
            onPress={() => router.push("/workout-routine/create")}
          >
            <FontAwesome name="plus-circle" size={20} color={colors.primary} />
          </Pressable>
        </View>
        {routines.length === 0 ? (
          <View style={styles.emptyCard}>
            <FontAwesome name="list-alt" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No routines yet</Text>
            <Text style={styles.emptyHint}>Create a routine to organize your exercises</Text>
          </View>
        ) : (
          routines.slice(0, 5).map((routine) => (
            <Pressable
              key={routine.id}
              style={({ pressed }) => [styles.listCard, pressed && styles.pressedCard]}
              accessibilityRole="button"
              accessibilityLabel={`View routine: ${routine.name}`}
              onPress={() => router.push(`/workout-routine/${routine.id}`)}
            >
              <View>
                <Text style={styles.listCardTitle}>{routine.name}</Text>
                <Text style={styles.listCardSub}>
                  {routine.exercise_count} exercises
                  {routine.estimated_duration_minutes
                    ? ` \u00b7 ~${routine.estimated_duration_minutes} min`
                    : ""}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
            </Pressable>
          ))
        )}
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {recentSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <FontAwesome name="clock-o" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No sessions logged yet</Text>
            <Text style={styles.emptyHint}>Start a workout to begin tracking</Text>
          </View>
        ) : (
          recentSessions.map((session) => (
            <Pressable
              key={session.id}
              style={({ pressed }) => [styles.listCard, pressed && styles.pressedCard]}
              accessibilityRole="button"
              accessibilityLabel={`View session: ${session.name}`}
              onPress={() => router.push(`/workout-session/${session.id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.listCardTitle}>{session.name}</Text>
                <Text style={styles.listCardSub}>
                  {new Date(session.started_at).toLocaleDateString()} \u00b7{" "}
                  {session.exercise_count} exercises \u00b7 {session.total_sets} sets
                  {session.duration_minutes ? ` \u00b7 ${session.duration_minutes} min` : ""}
                </Text>
              </View>
              {session.completed_at ? (
                <FontAwesome name="check-circle" size={16} color={colors.success} />
              ) : (
                <FontAwesome name="clock-o" size={16} color={colors.primary} />
              )}
            </Pressable>
          ))
        )}
      </View>

      {/* Navigation links */}
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.navLink, pressed && styles.pressedCard]}
          accessibilityRole="button"
          accessibilityLabel="Detailed Stats and Progress"
          onPress={() => router.push("/exercise/stats")}
        >
          <FontAwesome name="bar-chart" size={16} color={colors.primary} />
          <Text style={styles.navLinkText}>Detailed Stats & Progress</Text>
          <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.navLink, pressed && styles.pressedCard]}
          accessibilityRole="button"
          accessibilityLabel="Manage Regimes"
          onPress={() => router.push("/exercise-regime/create")}
        >
          <FontAwesome name="calendar" size={16} color={colors.primary} />
          <Text style={styles.navLinkText}>Manage Regimes</Text>
          <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.navLink, pressed && styles.pressedCard]}
          accessibilityRole="button"
          accessibilityLabel="Gym Locations"
          onPress={() => router.push("/gym-location/manage")}
        >
          <FontAwesome name="map-marker" size={16} color={colors.primary} />
          <Text style={styles.navLinkText}>Gym Locations</Text>
          <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.navLink, pressed && styles.pressedCard]}
          accessibilityRole="button"
          accessibilityLabel="Create Custom Exercise"
          onPress={() => router.push("/exercise/create")}
        >
          <FontAwesome name="plus-square-o" size={16} color={colors.primary} />
          <Text style={styles.navLinkText}>Create Custom Exercise</Text>
          <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
        </Pressable>
      </View>

      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  header: {
    margin: 16,
    marginTop: 10,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    borderRadius: 26,
    backgroundColor: "rgba(54,94,130,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 3,
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.11)",
    top: -50,
    right: -18,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(123,220,225,0.12)",
    bottom: -18,
    left: -10,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textWhite,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
    lineHeight: 20,
  },
  headerPill: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    minWidth: 78,
  },
  headerPillValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textWhite,
  },
  headerPillLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  gymBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(54,94,130,0.92)",
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 2,
  },
  gymBannerTitle: { fontSize: 15, fontWeight: "700", color: colors.textWhite },
  gymBannerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
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

  // List cards
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  listCardTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  listCardSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },

  // Empty state
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  emptyHint: { fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 18 },

  // Nav links
  navLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  navLinkText: { fontSize: 15, fontWeight: "500", color: colors.textPrimary, flex: 1 },
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
