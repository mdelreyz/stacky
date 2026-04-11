import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";
import { healthJournal as journalApi } from "@/lib/api";
import type { HealthJournalEntry } from "@/lib/api";

const METRIC_ICONS: Record<string, string> = {
  energy: "bolt",
  mood: "smile-o",
  sleep: "moon-o",
  stress: "heartbeat",
};

const METRIC_COLORS: Record<string, string> = {
  energy: colors.warning,
  mood: colors.primary,
  sleep: colors.accent,
  stress: colors.danger,
};

export function JournalPromptCard({ date }: { date: string }) {
  const [entry, setEntry] = useState<HealthJournalEntry | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    journalApi
      .getByDate(date)
      .then((result) => {
        if (!cancelled) setEntry(result);
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  // Still loading
  if (entry === undefined) return null;

  const hasEntry = entry !== null;

  return (
    <Link href="/health-journal" asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={hasEntry ? "View journal entry" : "Log how you feel today"}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Journal</Text>
            <Text style={styles.subtitle}>
              {hasEntry ? "Today's check-in" : "How are you feeling?"}
            </Text>
          </View>
          <FontAwesome name="book" size={18} color={colors.primaryDark} />
        </View>

        {hasEntry ? (
          <View style={styles.metricsRow}>
            {entry.energy_level != null && (
              <MetricBadge metric="energy" value={entry.energy_level} />
            )}
            {entry.mood_level != null && (
              <MetricBadge metric="mood" value={entry.mood_level} />
            )}
            {entry.sleep_quality != null && (
              <MetricBadge metric="sleep" value={entry.sleep_quality} />
            )}
            {entry.stress_level != null && (
              <MetricBadge metric="stress" value={entry.stress_level} />
            )}
          </View>
        ) : (
          <Text style={styles.prompt}>
            Tap to log your energy, mood, sleep, and any symptoms.
          </Text>
        )}

        {hasEntry && entry.symptoms && entry.symptoms.length > 0 && (
          <View style={styles.symptomRow}>
            {entry.symptoms.slice(0, 3).map((s) => (
              <View key={s} style={styles.symptomChip}>
                <Text style={styles.symptomText}>{s}</Text>
              </View>
            ))}
            {entry.symptoms.length > 3 && (
              <Text style={styles.moreText}>+{entry.symptoms.length - 3}</Text>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function MetricBadge({ metric, value }: { metric: string; value: number }) {
  const icon = METRIC_ICONS[metric] ?? "circle";
  const color = METRIC_COLORS[metric] ?? colors.primary;
  return (
    <View style={styles.badge}>
      <FontAwesome name={icon as any} size={12} color={color} />
      <Text style={[styles.badgeValue, { color }]}>{value}</Text>
      <Text style={styles.badgeLabel}>{metric}</Text>
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
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  badge: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(240,244,248,0.78)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    gap: 3,
  },
  badgeValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  badgeLabel: {
    fontSize: 10,
    color: colors.gray,
    textTransform: "capitalize",
  },
  prompt: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 14,
  },
  symptomRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  symptomChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(243,247,251,0.9)",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  symptomText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  moreText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    alignSelf: "center",
  },
});
