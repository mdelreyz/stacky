import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { SessionExerciseCard } from "@/components/exercise/SessionExerciseCard";
import { ExerciseSearchPicker } from "@/components/exercise/ExerciseSearchPicker";
import { workoutSessions as sessionsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { Exercise, WorkoutSession, WorkoutSetInput } from "@protocols/domain";

export default function ActiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [elapsedMin, setElapsedMin] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = useCallback(async () => {
    if (!id) return;
    try {
      const data = await sessionsApi.get(id);
      setSession(data);
    } catch {
      showError("Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadSession();
    }, [loadSession])
  );

  // Timer
  useEffect(() => {
    if (!session || session.completed_at) return;
    const start = new Date(session.started_at).getTime();
    const tick = () => setElapsedMin(Math.floor((Date.now() - start) / 60000));
    tick();
    intervalRef.current = setInterval(tick, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session]);

  const handleLogSet = async (exerciseId: string, data: WorkoutSetInput) => {
    if (!id) return;
    try {
      await sessionsApi.logSet(id, exerciseId, data);
      await loadSession();
    } catch {
      showError("Failed to log set");
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!id || !session) return;
    try {
      await sessionsApi.addExercise(id, {
        exercise_id: exercise.id,
        sort_order: session.logged_exercises.length,
      });
      setShowPicker(false);
      await loadSession();
    } catch {
      showError("Failed to add exercise");
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      await sessionsApi.update(id, {
        completed_at: new Date().toISOString(),
        duration_minutes: elapsedMin,
      });
      router.replace("/(tabs)/exercise");
    } catch {
      showError("Failed to complete session");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  if (showPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Pressable
            onPress={() => setShowPicker(false)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.pickerTitle}>Add Exercise</Text>
          <View style={{ width: 18 }} />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <ExerciseSearchPicker
            onSelect={handleAddExercise}
            selectedIds={session.logged_exercises.map((e) => e.exercise_id)}
          />
        </View>
      </View>
    );
  }

  const isComplete = !!session.completed_at;
  const totalSets = session.logged_exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const totalVolume = session.logged_exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => !s.is_warmup).reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0),
    0,
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <FlowScreenHeader
        title={session.name}
        subtitle={isComplete ? "Completed" : `In progress \u00b7 ${elapsedMin} min`}
      />

      {/* Session stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{session.logged_exercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
          </Text>
          <Text style={styles.statLabel}>Volume</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{isComplete ? session.duration_minutes ?? "-" : elapsedMin}</Text>
          <Text style={styles.statLabel}>Min</Text>
        </View>
      </View>

      {/* Exercise cards */}
      <View style={styles.exercisesList}>
        {session.logged_exercises.map((exercise) => (
          <SessionExerciseCard
            key={exercise.id}
            exercise={exercise}
            onLogSet={handleLogSet}
          />
        ))}

        {/* Add exercise */}
        {!isComplete && (
          <Pressable
            style={styles.addExBtn}
            onPress={() => setShowPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Add Exercise"
          >
            <FontAwesome name="plus" size={14} color={colors.primary} />
            <Text style={styles.addExText}>Add Exercise</Text>
          </Pressable>
        )}
      </View>

      {/* Complete button */}
      {!isComplete && (
        <View style={styles.footer}>
          <Pressable
            style={styles.completeBtn}
            onPress={handleComplete}
            accessibilityRole="button"
            accessibilityLabel="Finish Workout"
          >
            <FontAwesome name="check-circle" size={18} color={colors.textWhite} />
            <Text style={styles.completeBtnText}>Finish Workout</Text>
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
  errorText: { fontSize: 16, color: colors.textMuted },

  statsBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  exercisesList: { paddingHorizontal: 16 },

  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  addExText: { fontSize: 15, fontWeight: "600", color: colors.primary },

  footer: { paddingHorizontal: 16, marginTop: 24 },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 16,
  },
  completeBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },

  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
});
