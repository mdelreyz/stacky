import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { exerciseStats as statsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { ExerciseStatsOverview, MuscleGroupVolume } from "@protocols/domain";

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  quadriceps: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  core: "Core",
  full_body: "Full Body",
  cardio: "Cardio",
};

const MUSCLE_COLORS: Record<string, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  shoulders: "#f59e0b",
  biceps: "#10b981",
  triceps: "#8b5cf6",
  forearms: "#ec4899",
  quadriceps: "#06b6d4",
  hamstrings: "#f97316",
  glutes: "#14b8a6",
  calves: "#6366f1",
  core: "#84cc16",
  full_body: "#78716c",
  cardio: "#e11d48",
};

export default function ExerciseStatsScreen() {
  const router = useRouter();
  const [overview, setOverview] = useState<ExerciseStatsOverview | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [overviewRes, musclesRes] = await Promise.all([
        statsApi.overview().catch(() => null),
        statsApi.muscleGroups().catch(() => []),
      ]);
      setOverview(overviewRes);
      setMuscleGroups(musclesRes);
    } catch {
      showError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
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

  const weeks = overview?.weekly_summary ?? [];
  const maxVolume = Math.max(...weeks.map((w) => w.total_volume), 1);
  const totalMuscleVol = muscleGroups.reduce((a, m) => a + m.total_volume, 0) || 1;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <FlowScreenHeader title="Exercise Stats" subtitle="Your training overview and progress" />

      {/* Totals */}
      <View style={styles.section}>
        <View style={styles.totalsRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalValue}>{overview?.total_sessions ?? 0}</Text>
            <Text style={styles.totalLabel}>Sessions</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalValue}>
              {(overview?.total_volume ?? 0) >= 10000
                ? `${((overview?.total_volume ?? 0) / 1000).toFixed(0)}k`
                : Math.round(overview?.total_volume ?? 0)}
            </Text>
            <Text style={styles.totalLabel}>Total Volume</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalValue}>{overview?.favorite_exercise ?? "-"}</Text>
            <Text style={styles.totalLabel}>Favorite</Text>
          </View>
        </View>
      </View>

      {/* Weekly Volume Chart */}
      {weeks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Volume</Text>
          <View style={styles.chart}>
            {weeks.map((week, i) => {
              const height = Math.max((week.total_volume / maxVolume) * 120, 4);
              return (
                <View key={week.week} style={styles.barColumn}>
                  <Text style={styles.barValue}>
                    {week.total_volume >= 1000
                      ? `${(week.total_volume / 1000).toFixed(1)}k`
                      : Math.round(week.total_volume)}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: i === weeks.length - 1 ? colors.primary : colors.primaryLight,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>W{i + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Weekly Breakdown */}
      {weeks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          {[...weeks].reverse().map((week) => (
            <View key={week.week} style={styles.weekRow}>
              <Text style={styles.weekLabel}>{week.week}</Text>
              <View style={styles.weekStats}>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{week.sessions}</Text>
                  <Text style={styles.weekStatLabel}>sess</Text>
                </View>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{week.total_sets}</Text>
                  <Text style={styles.weekStatLabel}>sets</Text>
                </View>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{week.total_reps}</Text>
                  <Text style={styles.weekStatLabel}>reps</Text>
                </View>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>
                    {week.total_volume >= 1000
                      ? `${(week.total_volume / 1000).toFixed(1)}k`
                      : Math.round(week.total_volume)}
                  </Text>
                  <Text style={styles.weekStatLabel}>vol</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Muscle Group Distribution */}
      {muscleGroups.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Group Distribution</Text>
          {muscleGroups
            .sort((a, b) => b.total_volume - a.total_volume)
            .map((mg) => {
              const pct = (mg.total_volume / totalMuscleVol) * 100;
              const barColor = MUSCLE_COLORS[mg.muscle_group] ?? colors.primary;
              return (
                <View key={mg.muscle_group} style={styles.muscleRow}>
                  <View style={styles.muscleLabel}>
                    <Text style={styles.muscleName}>
                      {MUSCLE_LABELS[mg.muscle_group] ?? mg.muscle_group}
                    </Text>
                    <Text style={styles.muscleMeta}>
                      {mg.total_sets} sets \u00b7 {mg.exercise_count} exercises
                    </Text>
                  </View>
                  <View style={styles.muscleBarOuter}>
                    <View
                      style={[styles.muscleBarInner, { width: `${pct}%`, backgroundColor: barColor }]}
                    />
                  </View>
                  <Text style={styles.musclePct}>{Math.round(pct)}%</Text>
                </View>
              );
            })}
        </View>
      )}

      {/* Empty state */}
      {!overview && muscleGroups.length === 0 && (
        <View style={styles.emptyCard}>
          <FontAwesome name="bar-chart" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No workout data yet</Text>
          <Text style={styles.emptyHint}>Complete workouts to see your stats here</Text>
          <Pressable style={styles.startBtn} onPress={() => router.push("/workout-session/start")}>
            <Text style={styles.startBtnText}>Start a Workout</Text>
          </Pressable>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },

  // Totals
  totalsRow: { flexDirection: "row", gap: 8 },
  totalBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  totalValue: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  totalLabel: { fontSize: 11, color: colors.textMuted, marginTop: 3 },

  // Chart
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 8,
    minHeight: 180,
  },
  barColumn: { flex: 1, alignItems: "center", gap: 4 },
  bar: { width: "80%", borderRadius: 4, minHeight: 4 },
  barValue: { fontSize: 9, color: colors.textMuted, fontWeight: "600" },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  // Weekly breakdown
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  weekLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, width: 80 },
  weekStats: { flex: 1, flexDirection: "row", gap: 12 },
  weekStat: { alignItems: "center" },
  weekStatValue: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  weekStatLabel: { fontSize: 10, color: colors.textMuted },

  // Muscle groups
  muscleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  muscleLabel: { width: 100 },
  muscleName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  muscleMeta: { fontSize: 10, color: colors.textMuted },
  muscleBarOuter: {
    flex: 1,
    height: 14,
    backgroundColor: colors.surface,
    borderRadius: 7,
    overflow: "hidden",
  },
  muscleBarInner: { height: "100%", borderRadius: 7 },
  musclePct: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, width: 36, textAlign: "right" },

  // Empty
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 40,
  },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
  emptyHint: { fontSize: 13, color: colors.textMuted },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  startBtnText: { fontSize: 14, fontWeight: "600", color: colors.textWhite },
});
