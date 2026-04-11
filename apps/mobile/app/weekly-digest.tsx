import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { weeklyDigest as digestApi } from "@/lib/api";
import { formatIsoDate, getTodayIsoDate, shiftIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";
import type { WeeklyDigest } from "@/lib/api";

export default function WeeklyDigestScreen() {
  const [weekEnd, setWeekEnd] = useState(getTodayIsoDate);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDigest = useCallback(async (endDate: string) => {
    setLoading(true);
    try {
      const result = await digestApi.get(endDate);
      setDigest(result);
    } catch (error: any) {
      showError(error.message || "Failed to load digest");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDigest(weekEnd);
    }, [loadDigest, weekEnd])
  );

  const goBack = () => setWeekEnd((prev) => shiftIsoDate(prev, -7));
  const goForward = () => {
    const next = shiftIsoDate(weekEnd, 7);
    if (next <= getTodayIsoDate()) setWeekEnd(next);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!digest) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Digest unavailable</Text>
      </View>
    );
  }

  const completionPct = Math.round(digest.adherence.completion_rate * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Weekly Digest"
          subtitle={`${formatIsoDate(digest.week_start)} — ${formatIsoDate(digest.week_end)}`}
        />

        {/* Week navigation */}
        <View style={styles.navRow}>
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          >
            <FontAwesome name="chevron-left" size={14} color={colors.primaryDark} />
          </Pressable>
          <Text style={styles.navLabel}>This Week</Text>
          <Pressable
            onPress={goForward}
            style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
            accessibilityRole="button"
            accessibilityLabel="Next week"
          >
            <FontAwesome name="chevron-right" size={14} color={colors.primaryDark} />
          </Pressable>
        </View>

        {/* Highlights */}
        {digest.highlights.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome name="star" size={15} color={colors.warning} />
              <Text style={styles.cardTitle}>Highlights</Text>
            </View>
            {digest.highlights.map((h, i) => (
              <Text key={i} style={styles.highlightText}>{h}</Text>
            ))}
          </View>
        )}

        {/* Adherence */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="check-circle" size={15} color={colors.success} />
            <Text style={styles.cardTitle}>Adherence</Text>
          </View>
          <View style={styles.statsRow}>
            <StatBox label="Completion" value={`${completionPct}%`} color={colors.primaryDark} />
            <StatBox label="Taken" value={String(digest.adherence.taken_count)} color={colors.success} />
            <StatBox label="Skipped" value={String(digest.adherence.skipped_count)} color={colors.danger} />
          </View>

          {/* Daily bar chart */}
          <View style={styles.barChart}>
            {digest.adherence.daily_rates.map((day) => {
              const height = day.rate != null ? Math.max(day.rate * 60, 4) : 4;
              const isBest = day.date === digest.adherence.best_day;
              const isWorst = day.date === digest.adherence.worst_day;
              const barColor = isBest
                ? colors.success
                : isWorst
                  ? colors.danger
                  : colors.primary;
              const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "narrow",
              });
              return (
                <View key={day.date} style={styles.barCol}>
                  <View style={[styles.bar, { height, backgroundColor: barColor }]} />
                  <Text style={styles.barLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>

          {digest.adherence.best_day && (
            <Text style={styles.metaText}>
              Best: {formatIsoDate(digest.adherence.best_day)}
              {digest.adherence.worst_day ? ` · Worst: ${formatIsoDate(digest.adherence.worst_day)}` : ""}
            </Text>
          )}
        </View>

        {/* Journal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="book" size={15} color={colors.accent} />
            <Text style={styles.cardTitle}>Journal</Text>
          </View>
          {digest.journal.entry_count === 0 ? (
            <Text style={styles.emptyText}>No journal entries this week.</Text>
          ) : (
            <>
              <View style={styles.statsRow}>
                {digest.journal.avg_energy != null && (
                  <StatBox label="Energy" value={String(digest.journal.avg_energy)} color={colors.warning} />
                )}
                {digest.journal.avg_mood != null && (
                  <StatBox label="Mood" value={String(digest.journal.avg_mood)} color={colors.primary} />
                )}
                {digest.journal.avg_sleep != null && (
                  <StatBox label="Sleep" value={String(digest.journal.avg_sleep)} color={colors.accent} />
                )}
                {digest.journal.avg_stress != null && (
                  <StatBox label="Stress" value={String(digest.journal.avg_stress)} color={colors.danger} />
                )}
              </View>
              <Text style={styles.metaText}>{digest.journal.entry_count} entries this week</Text>

              {Object.keys(digest.journal.symptom_frequency).length > 0 && (
                <View style={styles.symptomRow}>
                  {Object.entries(digest.journal.symptom_frequency)
                    .slice(0, 4)
                    .map(([symptom, count]) => (
                      <View key={symptom} style={styles.symptomChip}>
                        <Text style={styles.symptomText}>
                          {symptom} ({count})
                        </Text>
                      </View>
                    ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Exercise */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="heartbeat" size={15} color={colors.danger} />
            <Text style={styles.cardTitle}>Exercise</Text>
          </View>
          {digest.exercise.session_count === 0 ? (
            <Text style={styles.emptyText}>No workout sessions this week.</Text>
          ) : (
            <View style={styles.statsRow}>
              <StatBox label="Sessions" value={String(digest.exercise.session_count)} color={colors.primaryDark} />
              <StatBox label="Sets" value={String(digest.exercise.total_sets)} color={colors.success} />
              <StatBox
                label="Volume"
                value={digest.exercise.total_volume > 1000
                  ? `${(digest.exercise.total_volume / 1000).toFixed(1)}k`
                  : String(Math.round(digest.exercise.total_volume))
                }
                color={colors.warning}
              />
            </View>
          )}
        </View>
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1200 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  navPressed: { opacity: 0.7 },
  navLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  highlightText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(248,251,255,0.84)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 3,
    textTransform: "uppercase",
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 80,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  bar: {
    width: "70%",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  symptomRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  symptomChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(243,247,251,0.9)",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  symptomText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
