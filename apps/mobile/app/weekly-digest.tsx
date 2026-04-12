import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { WeeklyDigestAdherenceCard } from "@/components/weekly-digest/WeeklyDigestAdherenceCard";
import { WeeklyDigestComparisonCard } from "@/components/weekly-digest/WeeklyDigestComparisonCard";
import { WeeklyDigestExerciseCard } from "@/components/weekly-digest/WeeklyDigestExerciseCard";
import { WeeklyDigestHighlightsCard } from "@/components/weekly-digest/WeeklyDigestHighlightsCard";
import { WeeklyDigestJournalCard } from "@/components/weekly-digest/WeeklyDigestJournalCard";
import { formatDateRange } from "@/components/weekly-digest/format";
import { styles } from "@/components/weekly-digest/styles";
import { colors } from "@/constants/Colors";
import { formatIsoDate } from "@/lib/date";
import { useWeeklyDigestScreen } from "@/lib/useWeeklyDigestScreen";

export default function WeeklyDigestScreen() {
  const { digest, goBack, goForward, loading } = useWeeklyDigestScreen();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Weekly Digest"
          subtitle={`${formatIsoDate(digest.week_start)} — ${formatIsoDate(digest.week_end)}`}
        />

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

        <WeeklyDigestHighlightsCard highlights={digest.highlights} />
        <WeeklyDigestComparisonCard
          title="Vs Previous Week"
          icon="line-chart"
          iconColor={colors.info}
          currentRange={formatDateRange(digest.week_start, digest.week_end)}
          previousRange={formatDateRange(digest.comparison.previous_week_start, digest.comparison.previous_week_end)}
          completionDelta={digest.comparison.adherence_completion_rate.delta}
          journalDelta={digest.comparison.journal_entry_count.delta}
          exerciseDelta={digest.comparison.exercise_session_count.delta}
          volumeDelta={digest.comparison.exercise_total_volume.delta}
        />
        <WeeklyDigestComparisonCard
          title="Month to Date"
          icon="calendar"
          iconColor={colors.accent}
          currentRange={formatDateRange(
            digest.monthly_comparison.current_month_start,
            digest.monthly_comparison.current_month_end,
          )}
          previousRange={formatDateRange(
            digest.monthly_comparison.previous_month_start,
            digest.monthly_comparison.previous_month_end,
          )}
          completionDelta={digest.monthly_comparison.adherence_completion_rate.delta}
          journalDelta={digest.monthly_comparison.journal_entry_count.delta}
          exerciseDelta={digest.monthly_comparison.exercise_session_count.delta}
          volumeDelta={digest.monthly_comparison.exercise_total_volume.delta}
        />
        <WeeklyDigestAdherenceCard
          adherence={digest.adherence}
          completionPct={Math.round(digest.adherence.completion_rate * 100)}
        />
        <WeeklyDigestJournalCard journal={digest.journal} />
        <WeeklyDigestExerciseCard exercise={digest.exercise} />
      </FadeInView>

      <View style={styles.spacer} />
    </ScrollView>
  );
}
