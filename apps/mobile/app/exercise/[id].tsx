import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title={exercise.name}
          subtitle={exercise.user_id ? "Custom exercise" : "Catalog exercise"}
        />

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {MUSCLE_LABELS[exercise.primary_muscle] || exercise.primary_muscle}
            </Text>
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

        {(exercise.description || exercise.instructions) && (
          <View style={styles.section}>
            <View style={styles.bodyCard}>
              {exercise.description && (
                <View style={styles.bodyBlock}>
                  <Text style={styles.sectionEyebrow}>Overview</Text>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.bodyText}>{exercise.description}</Text>
                </View>
              )}
              {exercise.instructions && (
                <View style={styles.bodyBlock}>
                  <Text style={styles.sectionEyebrow}>Execution</Text>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  <Text style={styles.bodyText}>{exercise.instructions}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Support</Text>
            <Text style={styles.sectionTitle}>Secondary Muscles</Text>
            <View style={styles.secondaryCard}>
              <View style={styles.chipRow}>
                {exercise.secondary_muscles.map((m) => (
                  <View key={m} style={styles.chip}>
                    <Text style={styles.chipText}>{MUSCLE_LABELS[m] || m}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {progress && progress.sessions_count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Personal Data</Text>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.progressCard}>
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

              {progress.history.length > 0 && (
                <View style={styles.historyList}>
                  {progress.history.slice(-10).reverse().map((h, i) => (
                    <View key={`${h.date}-${i}`} style={styles.historyRow}>
                      <Text style={styles.historyDate}>{h.date}</Text>
                      <Text style={styles.historyDetail}>
                        {h.max_weight} kg \u00b7 {h.sets}x{h.reps} \u00b7 {h.volume.toLocaleString()} vol
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1180 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  errorText: { fontSize: 16, color: colors.textMuted },

  chipRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, flexWrap: "wrap" },
  chip: {
    backgroundColor: "rgba(255,255,255,0.68)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  chipAccent: { backgroundColor: "rgba(235,245,252,0.92)", borderColor: "rgba(104,138,160,0.2)" },
  chipAccentText: { fontSize: 12, color: colors.primaryDark, fontWeight: "700" },

  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginBottom: 12 },
  bodyCard: {
    borderRadius: 26,
    padding: 20,
    gap: 18,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  bodyBlock: { gap: 8 },
  bodyText: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
  secondaryCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },

  progressCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statBox: {
    minWidth: "48%",
    flexGrow: 1,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  statValue: { fontSize: 19, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  historyList: { marginTop: 16, gap: 8 },
  historyRow: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  historyDate: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  historyDetail: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});
