import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { DoseScheduleForm, type DoseScheduleState } from "@/components/SupplementScheduleForm";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { medications as medicationsApi, userMedications as userMedicationsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { isScheduleFrequency, isScheduleTakeWindow } from "@/lib/schedule";
import type { Medication, MedicationAIProfile } from "@/lib/api";

function readDefaultDose(aiProfile: MedicationAIProfile | null) {
  return aiProfile?.typical_dosages?.[0];
}

export default function ScheduleMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<DoseScheduleState>({
    dosageAmount: "",
    dosageUnit: "tablet",
    frequency: "daily",
    takeWindow: "morning_with_food",
    withFood: false,
    notes: "",
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    medicationsApi
      .get(id)
      .then((nextMedication) => {
        if (cancelled) return;
        setMedication(nextMedication);
        const aiProfile = nextMedication.ai_profile;
        const firstDose = readDefaultDose(aiProfile);
        const aiFrequency = String(firstDose?.frequency ?? "");
        const aiWindow = String(aiProfile?.timing_recommendations?.preferred_windows?.[0] ?? "");
        const aiWithFood = Boolean(aiProfile?.timing_recommendations?.with_food);
        setFormState({
          dosageAmount: firstDose?.amount ? String(firstDose.amount) : "1",
          dosageUnit: firstDose?.unit || nextMedication.form || "tablet",
          frequency: isScheduleFrequency(aiFrequency) ? aiFrequency : "daily",
          takeWindow: isScheduleTakeWindow(aiWindow) ? aiWindow : "morning_with_food",
          withFood: aiWithFood,
          notes: "",
        });
      })
      .catch(() => showError("Failed to load medication catalogs"))
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
    if (!medication) return;
    const parsedAmount = Number(formState.dosageAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError("Enter a valid dose amount.");
      return;
    }

    setSaving(true);
    try {
      await userMedicationsApi.add({
        medication_id: medication.id,
        dosage_amount: parsedAmount,
        dosage_unit: formState.dosageUnit.trim() || "tablet",
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        with_food: formState.withFood,
        notes: formState.notes.trim() || undefined,
        started_at: new Date().toISOString().slice(0, 10),
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to add medication");
    } finally {
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

  if (!medication) {
    return (
      <View style={styles.centered}>
        <Text>Medication not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title="Start Medication" subtitle={medication.name} />

      <DoseScheduleForm
        state={formState}
        setState={setFormState}
        saving={saving}
        primaryLabel="Add to My Protocols"
        onSubmit={handleSave}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
