import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";
import type { WorkoutRoutineListItem } from "@/lib/api";

type ExerciseRoutinesSectionProps = {
  routines: WorkoutRoutineListItem[];
  onCreateRoutine: () => void;
  onOpenRoutine: (routineId: string) => void;
};

export function ExerciseRoutinesSection({
  routines,
  onCreateRoutine,
  onOpenRoutine,
}: ExerciseRoutinesSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Routines</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create new routine"
          onPress={onCreateRoutine}
        >
          <FontAwesome name="plus-circle" size={20} color={colors.primary} />
        </Pressable>
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
            style={({ pressed }) => [styles.listCard, pressed && styles.pressedCard]}
            accessibilityRole="button"
            accessibilityLabel={`View routine: ${routine.name}`}
            onPress={() => onOpenRoutine(routine.id)}
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
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  listCardSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  pressedCard: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
