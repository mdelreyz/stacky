import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

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
          <FontAwesome name="line-chart" size={18} color="#1c7ed6" />
        </View>

        <View style={styles.metricsRow}>
          <Metric label="Completion" value={`${completionRate}%`} />
          <Metric label="Streak" value={`${overview.current_streak_days}d`} />
          <Metric label="Done" value={`${overview.taken_count}/${overview.scheduled_count}`} />
        </View>

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
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c7ed6",
  },
  metricLabel: {
    fontSize: 11,
    color: "#6c757d",
    marginTop: 4,
    textTransform: "uppercase",
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#34536b",
    marginTop: 14,
  },
});
