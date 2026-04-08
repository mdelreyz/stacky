import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams } from "expo-router";

import {
  ScheduleFrequency,
  ScheduleTakeWindow,
  SupplementScheduleForm,
  SupplementScheduleState,
} from "@/components/SupplementScheduleForm";
import { userSupplements as userSupplementsApi } from "@/lib/api";
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color="#495057" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Manage Schedule</Text>
          <Text style={styles.subtitle}>{userSupplement.supplement.name}</Text>
        </View>
      </View>

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

function showError(message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert("Error", message);
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#212529" },
  subtitle: { fontSize: 14, color: "#868e96", marginTop: 2 },
});
