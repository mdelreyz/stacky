import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { nutrition as nutritionApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { formatNutritionPhaseSummary, getNutritionCycleTypeLabel } from "@/lib/nutrition";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import type { NutritionCycle } from "@/lib/api";

export default function NutritionScreen() {
  const [plans, setPlans] = useState<NutritionCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await nutritionApi.list({ active_only: false });
      setPlans(response.items);
    } catch (error) {
      showError("Failed to load nutrition plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop />
      <FadeInView>
        <View style={styles.header}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Nutrition Plans</Text>
            <Text style={styles.subtitle}>
              Macro profiles, named diets, elimination phases, and custom food rules
            </Text>
          </View>
          <Link href="/nutrition/add" asChild>
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Add nutrition plan"
            >
              <FontAwesome name="plus" size={14} color={colors.primaryDark} />
              <Text style={styles.addButtonText}>New</Text>
            </Pressable>
          </Link>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <FontAwesome name="pie-chart" size={32} color={colors.primaryDark} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No nutrition plans configured</Text>
            <Text style={styles.emptyHint}>
              Build a macro profile, low FODMAP block, Atkins phase, or custom restriction plan and Today will surface the current phase.
            </Text>
          </View>
        ) : (
          plans.map((plan) => {
            const currentPhase = plan.phases[plan.current_phase_idx] ?? plan.phases[0];
            const summary = currentPhase ? formatNutritionPhaseSummary(currentPhase) : [];

            return (
              <Link key={plan.id} href={`/nutrition/${plan.id}`} asChild>
                <Pressable
                  style={({ pressed }) => [styles.planCard, pressed && styles.pressedCard]}
                  accessibilityRole="button"
                  accessibilityLabel={plan.name}
                >
                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planMeta}>
                        {getNutritionCycleTypeLabel(plan.cycle_type)} · Phase {plan.current_phase_idx + 1} of {plan.phases.length}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, plan.is_active ? styles.activePill : styles.inactivePill]}>
                      <Text style={[styles.statusText, plan.is_active ? styles.activeText : styles.inactiveText]}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {currentPhase ? <Text style={styles.phaseName}>{currentPhase.name}</Text> : null}
                  {summary.map((line) => (
                    <Text key={line} style={styles.summaryLine}>
                      {line}
                    </Text>
                  ))}
                  {currentPhase?.notes ? <Text style={styles.notes}>{currentPhase.notes}</Text> : null}
                  <Text style={styles.transitionMeta}>Next transition {plan.next_transition}</Text>
                </Pressable>
              </Link>
            );
          })
        )}
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    paddingBottom: 24,
    position: "relative",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    margin: 16,
    marginTop: 10,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 26,
    backgroundColor: "rgba(54,94,130,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 3,
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.11)",
    top: -50,
    right: -18,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -20,
    left: -12,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textWhite,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.74)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  addButtonText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textMuted,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  planCard: {
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
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  pressedCard: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  planMeta: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activePill: {
    backgroundColor: colors.successLight,
  },
  inactivePill: {
    backgroundColor: "rgba(240,244,248,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  activeText: {
    color: colors.success,
  },
  inactiveText: {
    color: colors.textMuted,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 10,
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
    color: colors.textMuted,
    marginTop: 10,
  },
});
