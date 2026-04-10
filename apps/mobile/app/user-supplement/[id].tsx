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

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import {
  SupplementScheduleForm,
  SupplementScheduleState,
} from "@/components/SupplementScheduleForm";
import { colors } from "@/constants/Colors";
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
      .catch(() => showError("Failed to load supplement"))
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
        <ActivityIndicator size="large" color={colors.primary} />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
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
          <Text style={styles.stockEyebrow}>Inventory</Text>
          <Text style={styles.stockTitle}>Supply Status</Text>
          <Pressable
            style={({ pressed }) => [
              styles.stockToggle,
              isOutOfStock && styles.stockToggleActive,
              pressed && styles.softPressed,
            ]}
            onPress={() => setIsOutOfStock((current) => !current)}
            accessibilityRole="checkbox"
            accessibilityLabel="Out of stock"
            accessibilityState={{ checked: isOutOfStock }}
          >
            <Text style={[styles.stockToggleText, isOutOfStock && styles.stockToggleTextActive]}>
              {isOutOfStock ? "Marked as out of stock" : "Mark as out of stock"}
            </Text>
          </Pressable>
          <Text style={styles.stockHint}>
            Out-of-stock supplements can be gathered into a generated refill note from the Protocols tab.
          </Text>
        </View>
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
  stockCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  stockEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  stockTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.grayDark,
    marginBottom: 12,
  },
  stockToggle: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  stockToggleActive: {
    backgroundColor: "rgba(255,248,235,0.9)",
    borderColor: "rgba(241,181,104,0.14)",
  },
  stockToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  stockToggleTextActive: {
    color: colors.warningDark,
  },
  stockHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 18,
  },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
