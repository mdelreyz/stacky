import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { PeptideScheduleForm, type PeptideScheduleState } from "@/components/PeptideScheduleForm";
import { userPeptides as userPeptidesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { ScheduleFrequency, ScheduleTakeWindow } from "@/lib/schedule";
import type { UserPeptide } from "@/lib/api";

export default function ManageUserPeptideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userPeptide, setUserPeptide] = useState<UserPeptide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<PeptideScheduleState>({
    dosageAmount: "",
    dosageUnit: "mcg",
    frequency: "daily",
    takeWindow: "morning_fasted",
    withFood: false,
    route: "subcutaneous",
    storageNotes: "",
    notes: "",
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    userPeptidesApi
      .get(id)
      .then((next) => {
        if (cancelled) return;
        setUserPeptide(next);
        setFormState({
          dosageAmount: String(next.dosage_amount),
          dosageUnit: next.dosage_unit,
          frequency: next.frequency as ScheduleFrequency,
          takeWindow: next.take_window as ScheduleTakeWindow,
          withFood: next.with_food,
          route: next.route || "subcutaneous",
          storageNotes: next.storage_notes || "",
          notes: next.notes || "",
        });
      })
      .catch(() => showError("Failed to load peptide"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    if (!userPeptide) return;
    const parsedAmount = Number(formState.dosageAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError("Enter a valid dosage amount.");
      return;
    }

    setSaving(true);
    try {
      await userPeptidesApi.update(userPeptide.id, {
        dosage_amount: parsedAmount,
        dosage_unit: formState.dosageUnit.trim() || "mcg",
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        with_food: formState.withFood,
        route: formState.route || null,
        storage_notes: formState.storageNotes.trim() || null,
        notes: formState.notes.trim() || null,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to update peptide");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = () => {
    Alert.alert(
      "Stop Taking",
      `Are you sure you want to stop taking ${userPeptide?.peptide.name ?? "this peptide"}? This will remove it from your daily plan.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Stop Taking", style: "destructive", onPress: handleRemove },
      ],
    );
  };

  const handleRemove = async () => {
    if (!userPeptide) return;
    setSaving(true);
    try {
      await userPeptidesApi.remove(userPeptide.id);
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to remove peptide");
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

  if (!userPeptide) {
    return (
      <View style={styles.centered}>
        <Text>Peptide not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Manage Schedule"
          subtitle={userPeptide.peptide.name}
        />

        <PeptideScheduleForm
          state={formState}
          setState={setFormState}
          saving={saving}
          primaryLabel="Save Changes"
          onSubmit={handleSave}
          secondaryLabel="Stop Taking"
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
  backdrop: { top: -48, height: 1120 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
