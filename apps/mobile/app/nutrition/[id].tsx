import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import {
  NutritionPlanForm,
  buildNutritionPhase,
  createDefaultNutritionPlanState,
} from "@/components/nutrition/NutritionPlanForm";
import { nutrition as nutritionApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { NutritionCycle } from "@/lib/api";

export default function ManageNutritionPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [nutritionPlan, setNutritionPlan] = useState<NutritionCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(createDefaultNutritionPlanState);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;
    nutritionApi
      .get(id)
      .then((plan) => {
        if (cancelled) {
          return;
        }

        setNutritionPlan(plan);
        const currentPhase = plan.phases[plan.current_phase_idx] ?? plan.phases[0];
        setFormState({
          name: plan.name,
          cycleType: plan.cycle_type,
          phaseName: currentPhase?.name ?? "Primary Phase",
          durationDays: String(currentPhase?.duration_days ?? 7),
          useMacroProfile: Boolean(currentPhase?.macro_profile),
          carbs: currentPhase?.macro_profile?.carbs ?? "medium",
          protein: currentPhase?.macro_profile?.protein ?? "medium",
          fat: currentPhase?.macro_profile?.fat ?? "medium",
          pattern: currentPhase?.pattern ?? "",
          restrictionsText: currentPhase?.restrictions.join(", ") ?? "",
          notes: currentPhase?.notes ?? "",
        });
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!nutritionPlan) {
      return;
    }
    if (!formState.name.trim()) {
      showError("Enter a plan name.");
      return;
    }

    const durationDays = Number(formState.durationDays);
    if (!durationDays || durationDays <= 0) {
      showError("Enter a valid phase length.");
      return;
    }

    setSaving(true);
    try {
      await nutritionApi.update(nutritionPlan.id, {
        cycle_type: formState.cycleType,
        name: formState.name.trim(),
        phase_started_at: nutritionPlan.phase_started_at,
        phases: [buildNutritionPhase(formState)],
        is_active: nutritionPlan.is_active,
      });
      router.replace("/(tabs)/nutrition");
    } catch (error: any) {
      showError(error.message || "Failed to update nutrition plan");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!nutritionPlan) {
      return;
    }

    setSaving(true);
    try {
      await nutritionApi.remove(nutritionPlan.id);
      router.replace("/(tabs)/nutrition");
    } catch (error: any) {
      showError(error.message || "Failed to stop nutrition plan");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  if (!nutritionPlan) {
    return (
      <View style={styles.centered}>
        <Text>Nutrition plan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title="Manage Nutrition Plan" subtitle={nutritionPlan.name} />

      <NutritionPlanForm
        state={formState}
        setState={setFormState}
        saving={saving}
        primaryLabel="Save Changes"
        onSubmit={handleSave}
        secondaryLabel="Stop Plan"
        onSecondaryAction={handleRemove}
      />

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});
