import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { SetInputRow } from "./SetInputRow";
import type { SessionExercise, WorkoutSet, WorkoutSetInput } from "@protocols/domain";

interface SessionExerciseCardProps {
  exercise: SessionExercise;
  onLogSet: (exerciseId: string, data: WorkoutSetInput) => Promise<void>;
}

export function SessionExerciseCard({ exercise, onLogSet }: SessionExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const nextSetNumber = exercise.sets.length + 1;

  const lastSet = exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1] : undefined;

  const handleLog = async (data: { set_number: number; reps: number; weight: number; is_warmup: boolean }) => {
    await onLogSet(exercise.id, {
      set_number: data.set_number,
      reps: data.reps,
      weight: data.weight,
      is_warmup: data.is_warmup,
    });
  };

  const totalVolume = exercise.sets
    .filter((s) => !s.is_warmup)
    .reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.softPressed]}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.exercise.name}, ${expanded ? "collapse" : "expand"}`}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
          <Text style={styles.exerciseMeta}>
            {exercise.sets.length} sets
            {totalVolume > 0 ? ` \u00b7 ${totalVolume.toLocaleString()} kg vol` : ""}
          </Text>
        </View>
        <FontAwesome name={expanded ? "chevron-up" : "chevron-down"} size={12} color={colors.textMuted} />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, { width: 22 }]}>Set</Text>
            <Text style={[styles.colHeader, { flex: 1 }]}>Weight</Text>
            <Text style={[styles.colHeader, { flex: 1 }]}>Reps</Text>
            <Text style={[styles.colHeader, { width: 30 }]} />
            <Text style={[styles.colHeader, { width: 34 }]} />
          </View>

          {/* Logged sets */}
          {exercise.sets.map((set) => (
            <View key={set.id} style={styles.loggedSetRow}>
              <Text style={[styles.loggedSetNum, set.is_warmup && styles.warmupText]}>{set.set_number}</Text>
              <Text style={[styles.loggedSetValue, { flex: 1 }]}>
                {set.weight ?? "-"}
              </Text>
              <Text style={[styles.loggedSetValue, { flex: 1 }]}>
                {set.reps ?? "-"}
              </Text>
              {set.is_warmup && (
                <View style={styles.warmupBadge}>
                  <Text style={styles.warmupBadgeText}>W</Text>
                </View>
              )}
              <FontAwesome name="check-circle" size={14} color={colors.success} style={{ width: 34, textAlign: "center" }} />
            </View>
          ))}

          {/* Next set input */}
          <SetInputRow
            setNumber={nextSetNumber}
            onLog={handleLog}
            previousSet={lastSet ? { reps: lastSet.reps, weight: lastSet.weight } : undefined}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  headerLeft: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  exerciseMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  body: { paddingHorizontal: 14, paddingBottom: 12 },
  tableHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  colHeader: { fontSize: 11, fontWeight: "600", color: colors.textMuted, textAlign: "center" },

  loggedSetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  loggedSetNum: { width: 22, fontSize: 13, fontWeight: "700", color: colors.textMuted, textAlign: "center" },
  loggedSetValue: { fontSize: 14, color: colors.textPrimary, textAlign: "center" },
  warmupText: { color: colors.primary },
  warmupBadge: {
    width: 30,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(234,242,248,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  warmupBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primaryDark },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
