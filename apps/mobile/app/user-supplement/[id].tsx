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
import { userSupplements as userSupplementsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { type ScheduleFrequency, type ScheduleTakeWindow } from "@/lib/schedule";
import type { UserSupplement } from "@/lib/api";

export default function ManageUserSupplementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userSupplement, setUserSupplement] = useState<UserSupplement | null>(null);
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
    userSupplementsApi
      .get(id)
      .then((nextUserSupplement) => {
        if (cancelled) return;
        setUserSupplement(nextUserSupplement);
        setFormState({
          dosageAmount: String(nextUserSupplement.dosage_amount),
          dosageUnit: nextUserSupplement.dosage_unit,
          frequency: nextUserSupplement.frequency as ScheduleFrequency,
          takeWindow: nextUserSupplement.take_window as ScheduleTakeWindow,
          withFood: nextUserSupplement.with_food,
          notes: nextUserSupplement.notes || "",
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
    if (!userSupplement) return;
    const parsedAmount = Number(formState.dosageAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError("Enter a valid dosage amount.");
      return;
    }

    setSaving(true);
    try {
      await userSupplementsApi.update(userSupplement.id, {
        dosage_amount: parsedAmount,
        dosage_unit: formState.dosageUnit.trim() || "capsule",
        frequency: formState.frequency,
        take_window: formState.takeWindow,
        with_food: formState.withFood,
        notes: formState.notes.trim() || null,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to update supplement");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!userSupplement) return;
    setSaving(true);
    try {
      await userSupplementsApi.remove(userSupplement.id);
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to remove supplement");
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

  if (!userSupplement) {
    return (
      <View style={styles.centered}>
        <Text>Supplement not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="Manage Schedule"
        subtitle={userSupplement.supplement.name}
      />

      <SupplementScheduleForm
        state={formState}
        setState={setFormState}
        saving={saving}
        primaryLabel="Save Changes"
        onSubmit={handleSave}
        secondaryLabel="Stop Taking"
        onSecondaryAction={handleRemove}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
