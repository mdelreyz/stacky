import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { TherapyScheduleForm, type TherapyScheduleState } from "@/components/TherapyScheduleForm";
import { userTherapies as userTherapiesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import {
  buildTherapySettings,
  formatLastCompletedAt,
  readTherapySettings,
} from "@/lib/therapy-settings";
import type { UserTherapy } from "@/lib/api";

export default function ManageUserTherapyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userTherapy, setUserTherapy] = useState<UserTherapy | null>(null);
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
    userTherapiesApi
      .get(id)
      .then((nextUserTherapy) => {
        if (cancelled) return;
        setUserTherapy(nextUserTherapy);
        const settingsState = readTherapySettings(nextUserTherapy.settings);
        setFormState({
          durationMinutes: nextUserTherapy.duration_minutes ? String(nextUserTherapy.duration_minutes) : "",
          frequency: nextUserTherapy.frequency,
          takeWindow: nextUserTherapy.take_window,
          sessionDetails: settingsState.sessionDetails,
          lastSessionDetails: settingsState.lastSessionDetails,
          lastSessionPattern: settingsState.lastSessionPattern,
          lastSessionVolume: settingsState.lastSessionVolume,
          lastSessionResponse: settingsState.lastSessionResponse,
          lastCompletedAt: formatLastCompletedAt(settingsState.lastCompletedAt) || "",
          notes: nextUserTherapy.notes || "",
        });
      })
      .catch(() => showError("Failed to load therapy"))
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
    if (!userTherapy) return;

    const parsedDuration = formState.durationMinutes.trim()
      ? Number(formState.durationMinutes)
      : null;
    if (parsedDuration !== null && (!parsedDuration || parsedDuration <= 0)) {
      showError("Enter a valid duration in minutes.");
      return;
    }

    setSaving(true);
    try {
      await userTherapiesApi.update(userTherapy.id, {
        duration_minutes: parsedDuration,
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        settings: buildTherapySettings({
          sessionDetails: formState.sessionDetails,
          lastSessionDetails: formState.lastSessionDetails,
          lastSessionPattern: formState.lastSessionPattern,
          lastSessionVolume: formState.lastSessionVolume,
          lastSessionResponse: formState.lastSessionResponse,
          lastCompletedAt: userTherapy.settings && typeof userTherapy.settings["last_completed_at"] === "string"
            ? (userTherapy.settings["last_completed_at"] as string)
            : "",
        }) ?? null,
        notes: formState.notes.trim() || null,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to update protocol");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = () => {
    Alert.alert(
      "Stop Protocol",
      `Are you sure you want to stop ${userTherapy?.therapy.name ?? "this modality"}? This will remove it from your daily plan.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Stop Protocol", style: "destructive", onPress: handleRemove },
      ],
    );
  };

  const handleRemove = async () => {
    if (!userTherapy) return;

    setSaving(true);
    try {
      await userTherapiesApi.remove(userTherapy.id);
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to remove protocol");
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

  if (!userTherapy) {
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
        <FlowScreenHeader title="Manage Protocol" subtitle={userTherapy.therapy.name} />

        <TherapyScheduleForm
          state={formState}
          setState={setFormState}
          saving={saving}
          primaryLabel="Save Changes"
          onSubmit={handleSave}
          secondaryLabel="Stop Protocol"
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
  backdrop: { top: -48, height: 1160 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
