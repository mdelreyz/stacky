import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import {
  SupplementScheduleForm,
  SupplementScheduleState,
} from "@/components/SupplementScheduleForm";
import { supplements as supplementsApi, userSupplements as userSupplementsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { isScheduleFrequency, isScheduleTakeWindow } from "@/lib/schedule";
import type { Supplement } from "@/lib/api";

export default function ScheduleSupplementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<SupplementScheduleState>({
    dosageAmount: "",
    dosageUnit: "capsule",
    frequency: "daily",
    takeWindow: "morning_with_food",
    withFood: false,
    notes: "",
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    supplementsApi
      .get(id)
      .then((nextSupplement) => {
        if (cancelled) return;
        setSupplement(nextSupplement);

        const ai = nextSupplement.ai_profile as Record<string, any> | null;
        const firstDosage = ai?.typical_dosages?.[0];
        const aiFrequency = String(firstDosage?.frequency || "");
        const aiWindow = String(ai?.timing_recommendations?.preferred_windows?.[0] || "");
        const aiWithFood = Boolean(ai?.timing_recommendations?.with_food);

        setFormState({
          dosageAmount: firstDosage?.amount ? String(firstDosage.amount) : "1",
          dosageUnit: firstDosage?.unit || nextSupplement.form || "capsule",
          frequency: isScheduleFrequency(aiFrequency) ? aiFrequency : "daily",
          takeWindow: isScheduleTakeWindow(aiWindow) ? aiWindow : "morning_with_food",
          withFood: aiWithFood,
          notes: "",
        });
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!supplement) return;
    const parsedAmount = Number(formState.dosageAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError("Enter a valid dosage amount.");
      return;
    }

    setSaving(true);
    try {
      await userSupplementsApi.add({
        supplement_id: supplement.id,
        dosage_amount: parsedAmount,
        dosage_unit: formState.dosageUnit.trim() || "capsule",
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        with_food: formState.withFood,
        notes: formState.notes.trim() || undefined,
        started_at: new Date().toISOString().slice(0, 10),
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to add supplement");
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

  if (!supplement) {
    return (
      <View style={styles.centered}>
        <Text>Supplement not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="Start Taking"
        subtitle={supplement.name}
      />

      <SupplementScheduleForm
        state={formState}
        setState={setFormState}
        saving={saving}
        primaryLabel="Add to My Protocol"
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
