import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { InteractionPreviewCard } from "@/components/InteractionPreviewCard";
import { TherapyScheduleForm, type TherapyScheduleState } from "@/components/TherapyScheduleForm";
import { therapies as therapiesApi, userTherapies as userTherapiesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { isScheduleFrequency, isScheduleTakeWindow } from "@/lib/schedule";
import { buildTherapySettings } from "@/lib/therapy-settings";
import type { Therapy } from "@/lib/api";

function readDefaultDuration(aiProfile: Record<string, unknown> | null): string {
  const value = aiProfile?.default_duration_minutes;
  return typeof value === "number" ? String(value) : "";
}

function readDefaultSessionDetails(aiProfile: Record<string, unknown> | null): string {
  const value = aiProfile?.session_template;
  return typeof value === "string" ? value : "";
}

export default function ScheduleTherapyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [therapy, setTherapy] = useState<Therapy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<TherapyScheduleState>({
    durationMinutes: "",
    frequency: "daily",
    takeWindow: "morning_with_food",
    sessionDetails: "",
    lastSessionDetails: "",
    lastSessionPattern: "",
    lastSessionVolume: "",
    lastSessionResponse: "",
    lastCompletedAt: "",
    notes: "",
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    therapiesApi
      .get(id)
      .then((nextTherapy) => {
        if (cancelled) return;
        setTherapy(nextTherapy);

        const aiProfile = nextTherapy.ai_profile as Record<string, unknown> | null;
        const aiFrequency = String(aiProfile?.default_frequency ?? "");
        const aiWindow = String(aiProfile?.default_take_window ?? "");
        setFormState({
          durationMinutes: readDefaultDuration(aiProfile),
          frequency: isScheduleFrequency(aiFrequency) ? aiFrequency : "daily",
          takeWindow: isScheduleTakeWindow(aiWindow) ? aiWindow : "morning_with_food",
          sessionDetails: readDefaultSessionDetails(aiProfile),
          lastSessionDetails: "",
          lastSessionPattern: "",
          lastSessionVolume: "",
          lastSessionResponse: "",
          lastCompletedAt: "",
          notes: "",
        });
      })
      .catch(() => showError("Failed to load therapy catalogs"))
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
    if (!therapy) return;

    const parsedDuration = formState.durationMinutes.trim()
      ? Number(formState.durationMinutes)
      : undefined;
    if (parsedDuration !== undefined && (!parsedDuration || parsedDuration <= 0)) {
      showError("Enter a valid duration in minutes.");
      return;
    }

    setSaving(true);
    try {
      await userTherapiesApi.add({
        therapy_id: therapy.id,
        duration_minutes: parsedDuration,
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        settings: buildTherapySettings({
          sessionDetails: formState.sessionDetails,
          lastSessionDetails: formState.lastSessionDetails,
          lastSessionPattern: formState.lastSessionPattern,
          lastSessionVolume: formState.lastSessionVolume,
          lastSessionResponse: formState.lastSessionResponse,
          lastCompletedAt: formState.lastCompletedAt,
        }),
        notes: formState.notes.trim() || undefined,
        started_at: new Date().toISOString().slice(0, 10),
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to add protocol");
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

  if (!therapy) {
    return (
      <View style={styles.centered}>
        <Text>Therapy not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title="Start Protocol" subtitle={therapy.name} />
        <InteractionPreviewCard catalogId={therapy.id} itemType="therapy" />

        <TherapyScheduleForm
          state={formState}
          setState={setFormState}
          saving={saving}
          primaryLabel="Add to My Protocols"
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
  backdrop: { top: -48, height: 1180 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
