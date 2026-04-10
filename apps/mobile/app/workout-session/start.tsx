import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
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
            style={({ pressed }) => [
              styles.routineCard,
              !selectedRoutineId && styles.routineCardSelected,
              pressed && styles.softPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ad-hoc Workout: Start empty, add exercises as you go"
            accessibilityState={{ selected: !selectedRoutineId }}
            onPress={() => {
              setSelectedRoutineId(null);
              if (!sessionName.trim()) setSessionName("");
            }}
          >
            <FontAwesome name="bolt" size={18} color={!selectedRoutineId ? colors.primaryDark : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routineCardTitle}>Ad-hoc Workout</Text>
              <Text style={styles.routineCardSub}>Start empty, add exercises as you go</Text>
            </View>
            {!selectedRoutineId && <FontAwesome name="check" size={16} color={colors.primaryDark} />}
          </Pressable>

          {routines.map((routine) => (
            <Pressable
              key={routine.id}
              style={({ pressed }) => [
                styles.routineCard,
                selectedRoutineId === routine.id && styles.routineCardSelected,
                pressed && styles.softPressed,
              ]}
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
                color={selectedRoutineId === routine.id ? colors.primaryDark : colors.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.routineCardTitle}>{routine.name}</Text>
                <Text style={styles.routineCardSub}>
                  {routine.exercise_count} exercises
                  {routine.estimated_duration_minutes ? ` \u00b7 ~${routine.estimated_duration_minutes} min` : ""}
                </Text>
              </View>
              {selectedRoutineId === routine.id && (
                <FontAwesome name="check" size={16} color={colors.primaryDark} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              starting && styles.startBtnDisabled,
              pressed && !starting && styles.buttonPressed,
            ]}
            onPress={handleStart}
            disabled={starting}
            accessibilityRole="button"
            accessibilityLabel="Start Workout"
          >
            <FontAwesome name="play" size={16} color={colors.textWhite} />
            <Text style={styles.startBtnText}>{starting ? "Starting..." : "Start Workout"}</Text>
          </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 980 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  form: { paddingHorizontal: 20, gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  input: {
    backgroundColor: "rgba(248,251,255,0.84)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  routineCardSelected: {
    borderColor: "rgba(104,138,160,0.34)",
    backgroundColor: "rgba(246,249,252,0.9)",
  },
  routineCardTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  routineCardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer: { padding: 20 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
