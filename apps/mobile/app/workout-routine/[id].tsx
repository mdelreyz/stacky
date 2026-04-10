import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { workoutRoutines as routinesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { WorkoutRoutine } from "@/lib/api";

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRoutine = useCallback(async () => {
    if (!id) return;
    try {
      const data = await routinesApi.get(id);
      setRoutine(data);
    } catch {
      showError("Failed to load routine");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadRoutine();
    }, [loadRoutine])
  );

  const handleStartWorkout = () => {
    router.push(`/workout-session/start?routine_id=${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await routinesApi.delete(id);
      router.replace("/(tabs)/exercise");
    } catch {
      showError("Failed to delete routine");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Routine not found</Text>
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
          title={routine.name}
          subtitle={routine.description || `${routine.exercises.length} exercises`}
        />

        <View style={styles.metaRow}>
          {routine.estimated_duration_minutes && (
            <View style={styles.metaChip}>
              <FontAwesome name="clock-o" size={12} color={colors.textSecondary} />
              <Text style={styles.metaChipText}>~{routine.estimated_duration_minutes} min</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <FontAwesome name="list" size={12} color={colors.textSecondary} />
            <Text style={styles.metaChipText}>{routine.exercises.length} exercises</Text>
          </View>
          <View style={[styles.metaChip, routine.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.metaChipText, routine.is_active && styles.activeBadgeText]}>
              {routine.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.heroActionCard}>
            <View style={styles.heroGlow} />
            <Text style={styles.heroEyebrow}>Ready To Train</Text>
            <Text style={styles.heroTitle}>Launch this routine as a live session.</Text>
            <Pressable
              style={({ pressed }) => [styles.startBtn, pressed && styles.buttonPressed]}
              onPress={handleStartWorkout}
              accessibilityRole="button"
              accessibilityLabel={`Start workout: ${routine.name}`}
            >
              <FontAwesome name="play" size={15} color={colors.textWhite} />
              <Text style={styles.startBtnText}>Start Workout</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Routine Plan</Text>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <View style={styles.exerciseList}>
            {routine.exercises.map((ex, i) => (
              <View key={ex.id} style={styles.exerciseCard}>
                <View style={styles.exerciseBadge}>
                  <Text style={styles.exerciseIndex}>{i + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                  <Text style={styles.exerciseTargets}>
                    {[
                      ex.target_sets && `${ex.target_sets} sets`,
                      ex.target_reps && `${ex.target_reps} reps`,
                      ex.target_weight && `${ex.target_weight} kg`,
                      ex.rest_seconds && `${ex.rest_seconds}s rest`,
                    ]
                      .filter(Boolean)
                      .join(" \u00b7 ")}
                  </Text>
                  {ex.notes && <Text style={styles.exerciseNotes}>{ex.notes}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.softPressed]}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Deactivate Routine"
          >
            <FontAwesome name="trash-o" size={14} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Deactivate Routine</Text>
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
  backdrop: { top: -48, height: 1080 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  errorText: { fontSize: 16, color: colors.textMuted },

  metaRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.66)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  metaChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  activeBadge: { backgroundColor: "rgba(235,246,240,0.92)", borderColor: "rgba(95,156,120,0.2)" },
  activeBadgeText: { color: colors.success },
  inactiveBadge: { backgroundColor: "rgba(246,248,251,0.88)" },

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

  heroActionCard: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: "rgba(50,84,117,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 4,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -46,
    right: -10,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.64)",
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 31,
    fontWeight: "800",
    color: colors.textWhite,
    maxWidth: "82%",
    marginTop: 8,
    marginBottom: 18,
  },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  startBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },

  exerciseList: { gap: 10 },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  exerciseBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(237,245,252,0.94)",
  },
  exerciseIndex: { fontSize: 14, fontWeight: "700", color: colors.primaryDark, textAlign: "center" },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  exerciseTargets: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  exerciseNotes: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontStyle: "italic", lineHeight: 18 },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(203,91,91,0.24)",
    paddingVertical: 14,
    backgroundColor: "rgba(255,245,245,0.72)",
  },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: colors.danger },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
