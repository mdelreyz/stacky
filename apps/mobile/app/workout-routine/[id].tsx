import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

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
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title={routine.name}
        subtitle={routine.description || `${routine.exercises.length} exercises`}
      />

      {/* Meta */}
      <View style={styles.metaRow}>
        {routine.estimated_duration_minutes && (
          <View style={styles.metaChip}>
            <FontAwesome name="clock-o" size={12} color={colors.textMuted} />
            <Text style={styles.metaChipText}>~{routine.estimated_duration_minutes} min</Text>
          </View>
        )}
        <View style={styles.metaChip}>
          <FontAwesome name="list" size={12} color={colors.textMuted} />
          <Text style={styles.metaChipText}>{routine.exercises.length} exercises</Text>
        </View>
        <View style={[styles.metaChip, routine.is_active ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={styles.metaChipText}>{routine.is_active ? "Active" : "Inactive"}</Text>
        </View>
      </View>

      {/* Start button */}
      <View style={styles.section}>
        <Pressable style={styles.startBtn} onPress={handleStartWorkout}>
          <FontAwesome name="play" size={16} color={colors.textWhite} />
          <Text style={styles.startBtnText}>Start Workout</Text>
        </Pressable>
      </View>

      {/* Exercise list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        {routine.exercises.map((ex, i) => (
          <View key={ex.id} style={styles.exerciseRow}>
            <Text style={styles.exerciseIndex}>{i + 1}</Text>
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

      {/* Actions */}
      <View style={styles.section}>
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <FontAwesome name="trash-o" size={14} color={colors.danger} />
          <Text style={styles.deleteBtnText}>Deactivate Routine</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  errorText: { fontSize: 16, color: colors.textMuted },

  metaRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: { fontSize: 12, color: colors.textSecondary },
  activeBadge: { backgroundColor: colors.successLight },
  inactiveBadge: { backgroundColor: colors.surface },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
  },
  startBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  exerciseIndex: { fontSize: 14, fontWeight: "700", color: colors.textMuted, marginTop: 2, width: 20, textAlign: "center" },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  exerciseTargets: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  exerciseNotes: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontStyle: "italic" },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: colors.danger },
});
