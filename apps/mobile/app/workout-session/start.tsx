import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import {
  workoutRoutines as routinesApi,
  workoutSessions as sessionsApi,
} from "@/lib/api";
import { showError } from "@/lib/errors";
import type { WorkoutRoutineListItem } from "@/lib/api";

export default function StartSessionScreen() {
  const { routine_id } = useLocalSearchParams<{ routine_id?: string }>();
  const [routines, setRoutines] = useState<WorkoutRoutineListItem[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(routine_id ?? null);
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const res = await routinesApi.list({ active_only: true });
          setRoutines(res.items);
          // Auto-name if routine provided
          if (routine_id) {
            const match = res.items.find((r) => r.id === routine_id);
            if (match) setSessionName(match.name);
          }
        } catch {
          showError("Failed to load routines");
        } finally {
          setLoading(false);
        }
      })();
    }, [routine_id])
  );

  const handleStart = async () => {
    const name = sessionName.trim() || "Workout";
    setStarting(true);
    try {
      const session = await sessionsApi.start({
        routine_id: selectedRoutineId || undefined,
        name,
        started_at: new Date().toISOString(),
      });
      router.replace(`/workout-session/${session.id}`);
    } catch (error: any) {
      showError(error?.message || "Failed to start session");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <FlowScreenHeader title="Start Workout" subtitle="Pick a routine or start from scratch" />

      <View style={styles.form}>
        <Text style={styles.label}>Session Name</Text>
        <TextInput
          style={styles.input}
          value={sessionName}
          onChangeText={setSessionName}
          placeholder="e.g. Push Day, Morning Workout"
          placeholderTextColor={colors.textPlaceholder}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Select Routine (optional)</Text>

        <Pressable
          style={[styles.routineCard, !selectedRoutineId && styles.routineCardSelected]}
          accessibilityRole="button"
          accessibilityLabel="Ad-hoc Workout: Start empty, add exercises as you go"
          accessibilityState={{ selected: !selectedRoutineId }}
          onPress={() => {
            setSelectedRoutineId(null);
            if (!sessionName.trim()) setSessionName("");
          }}
        >
          <FontAwesome name="bolt" size={18} color={!selectedRoutineId ? colors.primary : colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routineCardTitle}>Ad-hoc Workout</Text>
            <Text style={styles.routineCardSub}>Start empty, add exercises as you go</Text>
          </View>
          {!selectedRoutineId && <FontAwesome name="check" size={16} color={colors.primary} />}
        </Pressable>

        {routines.map((routine) => (
          <Pressable
            key={routine.id}
            style={[styles.routineCard, selectedRoutineId === routine.id && styles.routineCardSelected]}
            accessibilityRole="button"
            accessibilityLabel={`Select routine: ${routine.name}`}
            accessibilityState={{ selected: selectedRoutineId === routine.id }}
            onPress={() => {
              setSelectedRoutineId(routine.id);
              if (!sessionName.trim() || sessionName === "Workout") setSessionName(routine.name);
            }}
          >
            <FontAwesome
              name="list-ol"
              size={16}
              color={selectedRoutineId === routine.id ? colors.primary : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.routineCardTitle}>{routine.name}</Text>
              <Text style={styles.routineCardSub}>
                {routine.exercise_count} exercises
                {routine.estimated_duration_minutes ? ` \u00b7 ~${routine.estimated_duration_minutes} min` : ""}
              </Text>
            </View>
            {selectedRoutineId === routine.id && (
              <FontAwesome name="check" size={16} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.startBtn, starting && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={starting}
          accessibilityRole="button"
          accessibilityLabel="Start Workout"
        >
          <FontAwesome name="play" size={16} color={colors.textWhite} />
          <Text style={styles.startBtnText}>{starting ? "Starting..." : "Start Workout"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  form: { paddingHorizontal: 20, gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  routineCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  routineCardTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  routineCardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer: { padding: 20 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },
});
