import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { formatNutritionPhaseSummary, getNutritionCycleTypeLabel } from "@/lib/nutrition";
import type { ActiveNutritionPhase } from "@/lib/api";

export function NutritionPhaseCard({ phase }: { phase: ActiveNutritionPhase | null }) {
  if (!phase) {
    return null;
  }

  const summary = formatNutritionPhaseSummary(phase);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="cutlery" size={16} color={colors.warning} />
        <Text style={styles.title}>Nutrition Focus</Text>
      </View>
      <Text style={styles.planName}>{phase.plan_name}</Text>
      <Text style={styles.phaseMeta}>
        {getNutritionCycleTypeLabel(phase.cycle_type)} · Phase {phase.current_phase_idx + 1} of {phase.total_phases}
      </Text>
      <Text style={styles.phaseName}>{phase.name}</Text>
      {summary.map((line) => (
        <Text key={line} style={styles.summaryLine}>
          {line}
        </Text>
      ))}
      {phase.notes ? <Text style={styles.notes}>{phase.notes}</Text> : null}
      {phase.total_phases > 1 ? (
        <Text style={styles.transitionMeta}>
          Next transition in {phase.days_until_transition} day{phase.days_until_transition === 1 ? "" : "s"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.badgeYellowLight,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.badgeYellowBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.warning,
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent,
  },
  phaseMeta: {
    fontSize: 12,
    color: colors.warningDark,
    marginTop: 4,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 8,
  },
  summaryLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  notes: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 8,
    lineHeight: 18,
  },
  transitionMeta: {
    fontSize: 12,
    color: colors.warningDark,
    marginTop: 10,
    fontWeight: "600",
  },
});
