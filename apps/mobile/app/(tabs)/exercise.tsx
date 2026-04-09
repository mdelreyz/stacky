import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, useFocusEffect, useRouter } from "expo-router";

import { colors } from "@/constants/Colors";
import {
  exerciseRegimes as regimesApi,
  exerciseStats as statsApi,
  workoutRoutines as routinesApi,
  workoutSessions as sessionsApi,
} from "@/lib/api";
import { showError } from "@/lib/errors";
import type {
  ExerciseStatsOverview,
  WorkoutRoutine,
  WorkoutRoutineListItem,
  WorkoutSessionListItem,
} from "@/lib/api";

export default function ExerciseScreen() {
  const router = useRouter();
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
    }, [loadData])
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Today's Workout */}
      {todayRoutines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          {todayRoutines.map((routine) => (
            <Pressable
              key={routine.id}
              style={styles.todayCard}
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
          <Link href="/workout-session/start" asChild>
            <Pressable style={styles.actionBtn}>
              <FontAwesome name="plus" size={18} color={colors.textWhite} />
              <Text style={styles.actionBtnText}>Start Workout</Text>
            </Pressable>
          </Link>
          <Link href="/workout-routine/create" asChild>
            <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]}>
              <FontAwesome name="list-ol" size={16} color={colors.primary} />
              <Text style={styles.actionBtnTextSecondary}>New Routine</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* My Routines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Routines</Text>
          <Link href="/workout-routine/create" asChild>
            <Pressable>
              <FontAwesome name="plus-circle" size={20} color={colors.primary} />
            </Pressable>
          </Link>
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
              style={styles.listCard}
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
              style={styles.listCard}
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
        <Link href="/exercise-regime/create" asChild>
          <Pressable style={styles.navLink}>
            <FontAwesome name="calendar" size={16} color={colors.primary} />
            <Text style={styles.navLinkText}>Manage Regimes</Text>
            <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
          </Pressable>
        </Link>
        <Link href="/gym-location/manage" asChild>
          <Pressable style={styles.navLink}>
            <FontAwesome name="map-marker" size={16} color={colors.primary} />
            <Text style={styles.navLinkText}>Gym Locations</Text>
            <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
          </Pressable>
        </Link>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },

  // Today card
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  todayCardContent: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  todayCardText: { flex: 1 },
  todayCardTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  todayCardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  // Stats
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
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
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: colors.textWhite },
  actionBtnSecondary: {
    backgroundColor: colors.primaryLight,
  },
  actionBtnTextSecondary: { fontSize: 15, fontWeight: "600", color: colors.primary },

  // List cards
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  listCardTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  listCardSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },

  // Empty state
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  emptyHint: { fontSize: 12, color: colors.textMuted },

  // Nav links
  navLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  navLinkText: { fontSize: 15, fontWeight: "500", color: colors.textPrimary, flex: 1 },
});
