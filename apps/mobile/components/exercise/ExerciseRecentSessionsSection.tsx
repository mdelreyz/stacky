import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";
import type { WorkoutSessionListItem } from "@/lib/api";

type ExerciseRecentSessionsSectionProps = {
  sessions: WorkoutSessionListItem[];
  onOpenSession: (sessionId: string) => void;
};

export function ExerciseRecentSessionsSection({
  sessions,
  onOpenSession,
}: ExerciseRecentSessionsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <FontAwesome name="clock-o" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No sessions logged yet</Text>
          <Text style={styles.emptyHint}>Start a workout to begin tracking</Text>
        </View>
      ) : (
        sessions.map((session) => (
          <Pressable
            key={session.id}
            style={({ pressed }) => [styles.listCard, pressed && styles.pressedCard]}
            accessibilityRole="button"
            accessibilityLabel={`View session: ${session.name}`}
            onPress={() => onOpenSession(session.id)}
          >
            <View style={styles.cardCopy}>
              <Text style={styles.listCardTitle}>{session.name}</Text>
              <Text style={styles.listCardSub}>
                {new Date(session.started_at).toLocaleDateString()} \u00b7 {session.exercise_count} exercises
                {" \u00b7 "}
                {session.total_sets} sets
                {session.duration_minutes ? ` \u00b7 ${session.duration_minutes} min` : ""}
              </Text>
            </View>
            {session.completed_at ? (
              <FontAwesome name="check-circle" size={16} color={colors.success} />
            ) : (
              <FontAwesome name="clock-o" size={16} color={colors.primary} />
            )}
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
  cardCopy: {
    flex: 1,
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
