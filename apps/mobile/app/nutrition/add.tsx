import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import {
  NutritionPlanForm,
  buildNutritionPhase,
  createDefaultNutritionPlanState,
} from "@/components/nutrition/NutritionPlanForm";
import { nutrition as nutritionApi } from "@/lib/api";
import { showError } from "@/lib/errors";

export default function AddNutritionPlanScreen() {
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(createDefaultNutritionPlanState);

  const handleSave = async () => {
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
      await nutritionApi.create({
        cycle_type: formState.cycleType,
        name: formState.name.trim(),
        phase_started_at: new Date().toISOString().slice(0, 10),
        phases: [buildNutritionPhase(formState)],
      });
      router.replace("/(tabs)/nutrition");
    } catch (error: any) {
      showError(error.message || "Failed to create nutrition plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title="New Nutrition Plan" subtitle="Build the current phase for your diet or macro protocol" />

      <NutritionPlanForm
        state={formState}
        setState={setFormState}
        saving={saving}
        primaryLabel="Save Nutrition Plan"
        onSubmit={handleSave}
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
});
