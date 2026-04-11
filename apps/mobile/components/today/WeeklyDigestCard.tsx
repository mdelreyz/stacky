import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { weeklyDigest as digestApi } from "@/lib/api";
import { cached } from "@/lib/cache";
import type { WeeklyDigest } from "@/lib/api";

export function WeeklyDigestCard() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      cached("weekly-digest:current", () => digestApi.get(), 60 * 60 * 1000)
        .then((result) => {
          if (!cancelled) setDigest(result);
        })
        .catch(() => {});

      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (!digest) return null;

  const { adherence, journal, exercise } = digest;
  const completionPct = Math.round(adherence.completion_rate * 100);
  const barWidth = Math.min(100, Math.max(0, completionPct));

  return (
    <Link href="/weekly-digest" asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel="View weekly digest"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Weekly Digest</Text>
            <Text style={styles.subtitle}>
              {formatDateRange(digest.week_start, digest.week_end)}
            </Text>
          </View>
          <FontAwesome name="calendar-check-o" size={18} color={colors.accent} />
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${barWidth}%`,
                  backgroundColor:
                    completionPct >= 80
                      ? colors.success
                      : completionPct >= 50
                        ? colors.warning
                        : colors.danger,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>{completionPct}%</Text>
        </View>

        <View style={styles.metricsRow}>
          <Metric
            icon="check-circle"
            label="Taken"
            value={String(adherence.taken_count)}
            color={colors.success}
          />
          <Metric
            icon="forward"
            label="Skipped"
            value={String(adherence.skipped_count)}
            color={colors.warningDark}
          />
          {exercise.session_count > 0 && (
            <Metric
              icon="heartbeat"
              label="Workouts"
              value={String(exercise.session_count)}
              color={colors.primary}
            />
          )}
          {journal.entry_count > 0 && journal.avg_mood !== null && (
            <Metric
              icon="smile-o"
              label="Avg Mood"
              value={journal.avg_mood.toFixed(1)}
              color={colors.accent}
            />
          )}
        </View>

        {digest.highlights.length > 0 && (
          <Text style={styles.highlight} numberOfLines={2}>
            {digest.highlights[0]}
          </Text>
        )}
      </Pressable>
    </Link>
  );
}

function Metric({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <FontAwesome name={icon as any} size={13} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
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
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(230,236,242,0.74)",
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 38,
    textAlign: "right",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(240,244,248,0.78)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.gray,
    textTransform: "uppercase",
  },
  highlight: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
