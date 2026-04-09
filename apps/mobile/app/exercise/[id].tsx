import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { exercises as exercisesApi, exerciseStats as statsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { Exercise, ExerciseProgress } from "@/lib/api";

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", forearms: "Forearms", quadriceps: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves", core: "Core", full_body: "Full Body", cardio: "Cardio",
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [progress, setProgress] = useState<ExerciseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void (async () => {
        try {
          const [ex, prog] = await Promise.all([
            exercisesApi.get(id),
            statsApi.exerciseProgress(id).catch(() => null),
          ]);
          setExercise(ex);
          setProgress(prog);
        } catch {
          showError("Failed to load exercise");
        } finally {
          setLoading(false);
        }
      })();
    }, [id])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title={exercise.name}
        subtitle={exercise.user_id ? "Custom exercise" : "Catalog exercise"}
      />

      {/* Info chips */}
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{MUSCLE_LABELS[exercise.primary_muscle] || exercise.primary_muscle}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{exercise.category}</Text>
        </View>
        {exercise.equipment !== "none" && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{exercise.equipment}</Text>
          </View>
        )}
        {exercise.is_compound && (
          <View style={[styles.chip, styles.chipAccent]}>
            <Text style={styles.chipAccentText}>Compound</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {exercise.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.bodyText}>{exercise.description}</Text>
        </View>
      )}

      {/* Instructions */}
      {exercise.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.bodyText}>{exercise.instructions}</Text>
        </View>
      )}

      {/* Secondary muscles */}
      {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Secondary Muscles</Text>
          <View style={styles.chipRow}>
            {exercise.secondary_muscles.map((m) => (
              <View key={m} style={styles.chip}>
                <Text style={styles.chipText}>{MUSCLE_LABELS[m] || m}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Personal progress */}
      {progress && progress.sessions_count > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            {progress.max_weight != null && (
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{progress.max_weight}</Text>
                <Text style={styles.statLabel}>Max (kg)</Text>
              </View>
            )}
            {progress.estimated_1rm != null && (
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{progress.estimated_1rm}</Text>
                <Text style={styles.statLabel}>Est 1RM</Text>
              </View>
            )}
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress.sessions_count}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {progress.total_volume >= 1000
                  ? `${(progress.total_volume / 1000).toFixed(1)}k`
                  : Math.round(progress.total_volume)}
              </Text>
              <Text style={styles.statLabel}>Volume</Text>
            </View>
          </View>

          {/* Simple history list */}
          {progress.history.length > 0 && (
            <View style={styles.historyList}>
              {progress.history.slice(-10).reverse().map((h, i) => (
                <View key={i} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{h.date}</Text>
                  <Text style={styles.historyDetail}>
                    {h.max_weight} kg \u00b7 {h.sets}x{h.reps} \u00b7 {h.volume.toLocaleString()} vol
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  errorText: { fontSize: 16, color: colors.textMuted },

  chipRow: { flexDirection: "row", paddingHorizontal: 20, gap: 6, flexWrap: "wrap" },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  chipAccent: { backgroundColor: colors.primaryLight },
  chipAccentText: { fontSize: 12, color: colors.primary, fontWeight: "600" },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  bodyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  historyList: { marginTop: 12 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  historyDate: { fontSize: 13, color: colors.textMuted },
  historyDetail: { fontSize: 13, color: colors.textSecondary },
});
