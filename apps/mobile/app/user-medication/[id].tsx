import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { colors } from "@/constants/Colors";
import { DoseScheduleForm, type DoseScheduleState } from "@/components/SupplementScheduleForm";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { userMedications as userMedicationsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { UserMedication } from "@/lib/api";

export default function ManageUserMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userMedication, setUserMedication] = useState<UserMedication | null>(null);
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
    userMedicationsApi
      .get(id)
      .then((nextUserMedication) => {
        if (cancelled) return;
        setUserMedication(nextUserMedication);
        setFormState({
          dosageAmount: String(nextUserMedication.dosage_amount),
          dosageUnit: nextUserMedication.dosage_unit,
          frequency: nextUserMedication.frequency,
          takeWindow: nextUserMedication.take_window,
          withFood: nextUserMedication.with_food,
          notes: nextUserMedication.notes || "",
        });
      })
      .catch(() => showError("Failed to load medication"))
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
    if (!userMedication) return;
    const parsedAmount = Number(formState.dosageAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError("Enter a valid dose amount.");
      return;
    }

    setSaving(true);
    try {
      await userMedicationsApi.update(userMedication.id, {
        dosage_amount: parsedAmount,
        dosage_unit: formState.dosageUnit.trim() || "tablet",
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        with_food: formState.withFood,
        notes: formState.notes.trim() || null,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to update medication");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!userMedication) return;

    setSaving(true);
    try {
      await userMedicationsApi.remove(userMedication.id);
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to remove medication");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!userMedication) {
    return (
      <View style={styles.centered}>
        <Text>Medication not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title="Manage Medication" subtitle={userMedication.medication.name} />

      <DoseScheduleForm
        state={formState}
        setState={setFormState}
        saving={saving}
        primaryLabel="Save Changes"
        onSubmit={handleSave}
        secondaryLabel="Stop Medication"
        onSecondaryAction={handleRemove}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
