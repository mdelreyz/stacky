import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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

  const confirmRemove = () => {
    Alert.alert(
      "Stop Medication",
      `Are you sure you want to stop ${userMedication?.medication.name ?? "this medication"}? This will remove it from your daily plan.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Stop Medication", style: "destructive", onPress: handleRemove },
      ],
    );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title="Manage Medication" subtitle={userMedication.medication.name} />

        <DoseScheduleForm
          state={formState}
          setState={setFormState}
          saving={saving}
          primaryLabel="Save Changes"
          onSubmit={handleSave}
          secondaryLabel="Stop Medication"
          onSecondaryAction={confirmRemove}
        />
      </FadeInView>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
