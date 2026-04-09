import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";
import type { TrackingOverview } from "@/lib/api";

export function TrackingSummaryCard({
  overview,
  endDate,
}: {
  overview: TrackingOverview | null;
  endDate: string;
}) {
  if (!overview) {
    return null;
  }

  const completionRate = Math.round(overview.completion_rate * 100);

  return (
    <Link href={{ pathname: "/tracking", params: { endDate } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tracking</Text>
            <Text style={styles.subtitle}>Last {overview.window_days} days</Text>
          </View>
          <FontAwesome name="line-chart" size={18} color={colors.primaryDark} />
        </View>

        <View style={styles.metricsRow}>
          <Metric label="Completion" value={`${completionRate}%`} />
          <Metric label="Streak" value={`${overview.current_streak_days}d`} />
          <Metric label="Done" value={`${overview.taken_count}/${overview.scheduled_count}`} />
        </View>

        {overview.daily_completion && <MiniStreak dailyCompletion={overview.daily_completion} />}

        {overview.suggestions.length > 0 ? (
          <Text style={styles.hint}>{overview.suggestions[0].headline}</Text>
        ) : (
          <Text style={styles.hint}>Open your execution history, missed items, and schedule-fit suggestions.</Text>
        )}
      </Pressable>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MiniStreak({ dailyCompletion }: { dailyCompletion: Record<string, boolean | null> }) {
  const dates = Object.keys(dailyCompletion).sort();
  const last7 = dates.slice(-7);
  if (last7.length === 0) return null;

  return (
    <View style={styles.streakRow}>
      {last7.map((date) => {
        const status = dailyCompletion[date];
        const dayLabel = new Date(date + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" });
        const dotColor =
          status === true ? colors.success : status === false ? "#ffa94d" : colors.border;
        return (
          <View key={date} style={styles.streakDay}>
            <Text style={styles.streakLabel}>{dayLabel}</Text>
            <View style={[styles.streakDot, { backgroundColor: dotColor }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eef7ff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d0ebff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c3d5a",
  },
  subtitle: {
    fontSize: 12,
    color: "#5c7c94",
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 4,
    textTransform: "uppercase",
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  streakDay: {
    alignItems: "center",
    gap: 4,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#5c7c94",
  },
  streakDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#34536b",
    marginTop: 14,
  },
});
