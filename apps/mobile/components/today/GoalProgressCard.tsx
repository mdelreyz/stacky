import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { goalProgress as goalProgressApi } from "@/lib/api";
import { cached } from "@/lib/cache";
import type { GoalProgressItem } from "@/lib/api";

const GOAL_ICON_MAP: Record<string, string> = {
  longevity: "heart",
  cognitive: "lightbulb-o",
  sleep: "moon-o",
  stress: "leaf",
  energy: "bolt",
  immunity: "shield",
  skin: "star",
  hair: "magic",
  joint_health: "hand-rock-o",
  gut_health: "circle-o",
  weight_management: "balance-scale",
  muscle_recovery: "refresh",
  cardiovascular: "heartbeat",
  hormonal_balance: "sliders",
};

export function GoalProgressCard() {
  const [goals, setGoals] = useState<GoalProgressItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      cached("goal-progress:7", () => goalProgressApi.get(7), 30 * 60 * 1000)
        .then((result) => {
          if (!cancelled && result.goals.length > 0) {
            setGoals(result.goals);
          }
        })
        .catch(() => {});

      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (goals.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Goal Progress</Text>
        <Text style={styles.subtitle}>7-day adherence</Text>
      </View>

      <View style={styles.goalsList}>
        {goals.map((goal) => (
          <GoalRow key={goal.goal} goal={goal} />
        ))}
      </View>
    </View>
  );
}

function GoalRow({ goal }: { goal: GoalProgressItem }) {
  const rate = goal.adherence_rate !== null ? Math.round(goal.adherence_rate * 100) : null;
  const barWidth = rate !== null ? Math.min(100, Math.max(0, rate)) : 0;
  const icon = GOAL_ICON_MAP[goal.goal] ?? "flag";
  const barColor =
    rate === null
      ? colors.border
      : rate >= 80
        ? colors.success
        : rate >= 50
          ? colors.warning
          : colors.danger;

  return (
    <View style={styles.goalRow}>
      <View style={styles.goalLabelRow}>
        <FontAwesome name={icon as any} size={13} color={colors.textSecondary} />
        <Text style={styles.goalLabel} numberOfLines={1}>
          {goal.label}
        </Text>
        <Text style={styles.goalCount}>{goal.item_count} items</Text>
        {rate !== null && <Text style={[styles.goalRate, { color: barColor }]}>{rate}%</Text>}
      </View>
      <View style={styles.goalBar}>
        <View style={[styles.goalBarFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  goalsList: {
    gap: 10,
  },
  goalRow: {
    gap: 6,
  },
  goalLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  goalCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  goalRate: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "right",
  },
  goalBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(230,236,242,0.74)",
    overflow: "hidden",
  },
  goalBarFill: {
    height: 6,
    borderRadius: 3,
  },
});
