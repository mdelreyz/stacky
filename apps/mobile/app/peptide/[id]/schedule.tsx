import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { InteractionPreviewCard } from "@/components/InteractionPreviewCard";
import { PeptideScheduleForm, type PeptideScheduleState } from "@/components/PeptideScheduleForm";
import { peptides as peptidesApi, userPeptides as userPeptidesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { isScheduleFrequency, isScheduleTakeWindow } from "@/lib/schedule";
import type { Peptide } from "@/lib/api";

function readAIString(profile: Record<string, unknown> | null, key: string): string {
  const value = profile?.[key];
  return typeof value === "string" ? value : "";
}

export default function SchedulePeptideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [peptide, setPeptide] = useState<Peptide | null>(null);
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
    peptidesApi
      .get(id)
      .then((nextPeptide) => {
        if (cancelled) return;
        setPeptide(nextPeptide);

        const ai = nextPeptide.ai_profile as Record<string, unknown> | null;
        const aiRoute = readAIString(ai, "recommended_route").toLowerCase();
        const aiFrequency = readAIString(ai, "default_frequency");
        const aiWindow = readAIString(ai, "default_take_window");
        const aiStorage = readAIString(ai, "storage");

        const routeOptions = ["subcutaneous", "intramuscular", "topical", "oral", "nasal"];
        const matchedRoute = routeOptions.find((r) => aiRoute.includes(r));

        setFormState({
          dosageAmount: readAIString(ai, "typical_dosage_amount") || "",
          dosageUnit: readAIString(ai, "typical_dosage_unit") || nextPeptide.form || "mcg",
          frequency: isScheduleFrequency(aiFrequency) ? aiFrequency : "daily",
          takeWindow: isScheduleTakeWindow(aiWindow) ? aiWindow : "morning_fasted",
          withFood: false,
          route: matchedRoute || "subcutaneous",
          storageNotes: aiStorage,
          notes: "",
        });
      })
      .catch(() => showError("Failed to load peptide"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    if (!peptide) return;
    const parsedAmount = Number(formState.dosageAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError("Enter a valid dosage amount.");
      return;
    }

    setSaving(true);
    try {
      await userPeptidesApi.add({
        peptide_id: peptide.id,
        dosage_amount: parsedAmount,
        dosage_unit: formState.dosageUnit.trim() || "mcg",
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        with_food: formState.withFood,
        route: formState.route || undefined,
        storage_notes: formState.storageNotes.trim() || undefined,
        notes: formState.notes.trim() || undefined,
        started_at: new Date().toISOString().slice(0, 10),
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to add peptide");
    } finally {
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

  if (!peptide) {
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
        <FlowScreenHeader title="Start Taking" subtitle={peptide.name} />
        <InteractionPreviewCard catalogId={peptide.id} itemType="peptide" />

        <PeptideScheduleForm
          state={formState}
          setState={setFormState}
          saving={saving}
          primaryLabel="Add to My Protocol"
          onSubmit={handleSave}
        />
      </FadeInView>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1140 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
