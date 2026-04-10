import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";

import { colors } from "@/constants/Colors";
import type { ExercisePlanItem } from "@protocols/domain";

const STATUS_CONFIG = {
  pending: { icon: "play-circle" as const, color: colors.primary, label: "Start" },
  in_progress: { icon: "clock-o" as const, color: colors.warning, label: "In Progress" },
  completed: { icon: "check-circle" as const, color: colors.success, label: "Done" },
};

export function TodayExerciseCard({ items }: { items: ExercisePlanItem[] }) {
  const router = useRouter();

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="heartbeat" size={16} color={colors.primary} />
        <Text style={styles.headerText}>Today's Workout</Text>
      </View>

      {items.map((item) => {
        const config = STATUS_CONFIG[item.status];
        return (
          <Pressable
            key={item.routine_id}
            style={styles.routineRow}
            onPress={() => {
              if (item.status === "pending") {
                router.push(`/workout-session/start?routine_id=${item.routine_id}`);
              } else {
                router.push("/(tabs)/exercise");
              }
            }}
          >
            <FontAwesome name={config.icon} size={22} color={config.color} />
            <View style={styles.routineInfo}>
              <Text style={styles.routineName}>{item.routine_name}</Text>
              <Text style={styles.routineMeta}>
                {item.regime_name} {"\u00b7"} {item.exercise_count} exercises
                {item.estimated_duration_minutes ? ` \u00b7 ~${item.estimated_duration_minutes} min` : ""}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.color + "18" }]}>
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerText: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },

  routineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  routineMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
});
