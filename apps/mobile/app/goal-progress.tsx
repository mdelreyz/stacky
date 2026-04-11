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
import { useFocusEffect, useRouter } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { goalProgress as goalApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { GoalProgressResponse, GoalProgressItem } from "@/lib/api";

const JOURNAL_METRIC_LABELS: Record<string, string> = {
  energy_level: "Energy",
  mood_level: "Mood",
  sleep_quality: "Sleep",
  stress_level: "Stress",
};

const GOAL_COLORS: Record<string, string> = {
  longevity: colors.primary,
  cognitive: colors.accent,
  sleep: colors.accent,
  stress: colors.danger,
  energy: colors.warning,
  immunity: colors.success,
  skin: colors.warning,
  hair: colors.success,
  joint_health: colors.primary,
  gut_health: colors.success,
  weight_management: colors.warning,
  muscle_recovery: colors.primaryDark,
  cardiovascular: colors.danger,
  hormonal_balance: colors.accent,
};

export default function GoalProgressScreen() {
  const router = useRouter();
  const [data, setData] = useState<GoalProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await goalApi.get();
      setData(result);
    } catch (error: any) {
      showError(error.message || "Failed to load goal progress");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data?.has_preferences) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AmbientBackdrop canvasStyle={styles.backdrop} />
        <FadeInView>
          <FlowScreenHeader title="Goal Progress" subtitle="Track how your stack supports your goals" />
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>No goals set</Text>
            <Text style={styles.emptyText}>
              Set your primary health goals in Preferences to see how your supplement stack aligns with them.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              onPress={() => router.push("/profile/preferences")}
              accessibilityRole="button"
              accessibilityLabel="Set Goals"
            >
              <FontAwesome name="sliders" size={14} color={colors.white} />
              <Text style={styles.ctaText}>Set Goals</Text>
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Goal Progress"
          subtitle={`${data.period_days}-day window`}
        />

        {data.goals.map((goal) => (
          <GoalCard key={goal.goal} goal={goal} />
        ))}
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function GoalCard({ goal }: { goal: GoalProgressItem }) {
  const color = GOAL_COLORS[goal.goal] ?? colors.primary;
  const adherencePct = goal.adherence_rate != null ? Math.round(goal.adherence_rate * 100) : null;

  return (
    <View style={styles.card}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, { backgroundColor: color + "14" }]}>
          <FontAwesome name={goal.icon as any} size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalLabel}>{goal.label}</Text>
          <Text style={styles.goalMeta}>
            {goal.item_count} supporting item{goal.item_count !== 1 ? "s" : ""}
          </Text>
        </View>
        {adherencePct != null && (
          <View style={[styles.adherenceBadge, { borderColor: color }]}>
            <Text style={[styles.adherenceValue, { color }]}>{adherencePct}%</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      {adherencePct != null && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${adherencePct}%`, backgroundColor: color }]} />
        </View>
      )}

      {/* Supporting items */}
      {goal.supporting_items.length > 0 && (
        <View style={styles.itemList}>
          {goal.supporting_items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: color }]} />
              <Text style={styles.itemName}>{item.name}</Text>
              {item.adherence_rate != null && (
                <Text style={styles.itemRate}>
                  {Math.round(item.adherence_rate * 100)}%
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Journal metric */}
      {goal.journal_metric && (
        <View style={styles.journalSection}>
          <Text style={styles.journalLabel}>
            {JOURNAL_METRIC_LABELS[goal.journal_metric] ?? goal.journal_metric} avg
          </Text>
          {goal.journal_avg != null ? (
            <View style={styles.journalRow}>
              <Text style={[styles.journalValue, { color }]}>{goal.journal_avg}/10</Text>
              {goal.journal_trend.length >= 3 && (
                <MiniTrend points={goal.journal_trend} color={color} />
              )}
            </View>
          ) : (
            <Text style={styles.noJournalText}>No journal data yet</Text>
          )}
        </View>
      )}

      {goal.item_count === 0 && !goal.journal_metric && (
        <Text style={styles.noItemsText}>
          No items in your stack currently support this goal.
        </Text>
      )}
    </View>
  );
}

function MiniTrend({ points, color }: { points: { value: number }[]; color: string }) {
  // Simple sparkline using dots
  const last7 = points.slice(-7);
  return (
    <View style={styles.trendRow}>
      {last7.map((p, i) => {
        const height = Math.max((p.value / 10) * 16, 3);
        return (
          <View key={i} style={[styles.trendBar, { height, backgroundColor: color }]} />
        );
      })}
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
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  goalMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  adherenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  adherenceValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(230,236,242,0.8)",
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  itemList: {
    marginTop: 12,
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemRate: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  journalSection: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(248,251,255,0.84)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  journalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  journalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  journalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  noJournalText: {
    fontSize: 12,
    color: colors.textPlaceholder,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  trendBar: {
    width: 8,
    borderRadius: 2,
  },
  noItemsText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 12,
  },
  ctaPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});
