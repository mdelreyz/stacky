import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
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
  const [isOutOfStock, setIsOutOfStock] = useState(false);

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
        setIsOutOfStock(nextUserSupplement.is_out_of_stock);
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
        is_out_of_stock: isOutOfStock,
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

      <View style={styles.stockCard}>
        <Text style={styles.stockTitle}>Supply Status</Text>
        <Pressable
          style={[styles.stockToggle, isOutOfStock && styles.stockToggleActive]}
          onPress={() => setIsOutOfStock((current) => !current)}
        >
          <Text style={[styles.stockToggleText, isOutOfStock && styles.stockToggleTextActive]}>
            {isOutOfStock ? "Marked as out of stock" : "Mark as out of stock"}
          </Text>
        </Pressable>
        <Text style={styles.stockHint}>
          Out-of-stock supplements can be gathered into a generated refill note from the Protocols tab.
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  stockCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#343a40",
    marginBottom: 12,
  },
  stockToggle: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  stockToggleActive: {
    backgroundColor: "#fff4e6",
    borderColor: "#ffd8a8",
  },
  stockToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#495057",
  },
  stockToggleTextActive: {
    color: "#e67700",
  },
  stockHint: {
    fontSize: 12,
    color: "#868e96",
    marginTop: 10,
    lineHeight: 18,
  },
});
