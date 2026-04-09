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
import { ProtocolForm, type ProtocolFormState } from "@/components/ProtocolForm";
import {
  userMedications as userMedicationsApi,
  protocols as protocolsApi,
  userSupplements as userSupplementsApi,
  userTherapies as userTherapiesApi,
} from "@/lib/api";
import { showError } from "@/lib/errors";
import {
  buildProtocolSchedule,
  createDefaultProtocolFormState,
  getProtocolScheduleValidationError,
  protocolScheduleFromProtocol,
} from "@/lib/protocol-schedule";
import type { Protocol, UserMedication, UserSupplement, UserTherapy } from "@/lib/api";

export default function ManageProtocolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [supplements, setSupplements] = useState<UserSupplement[]>([]);
  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [therapies, setTherapies] = useState<UserTherapy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<ProtocolFormState>(createDefaultProtocolFormState);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    Promise.allSettled([
      protocolsApi.get(id),
      userSupplementsApi.list(false),
      userMedicationsApi.list(false),
      userTherapiesApi.list(false),
    ])
      .then(([protocolResult, supplementsResult, medicationsResult, therapiesResult]) => {
        if (cancelled) return;
        if (protocolResult.status === "rejected") {
          showError("Failed to load protocol data");
          return;
        }
        const nextProtocol = protocolResult.value;
        setProtocol(nextProtocol);
        if (supplementsResult.status === "fulfilled") setSupplements(supplementsResult.value.items);
        if (medicationsResult.status === "fulfilled") setMedications(medicationsResult.value.items);
        if (therapiesResult.status === "fulfilled") setTherapies(therapiesResult.value.items);
        setFormState({
          name: nextProtocol.name,
          description: nextProtocol.description || "",
          selectedUserSupplementIds: nextProtocol.items
            .map((item) => item.user_supplement?.id)
            .filter((itemId): itemId is string => Boolean(itemId)),
          selectedUserMedicationIds: nextProtocol.items
            .map((item) => item.user_medication?.id)
            .filter((itemId): itemId is string => Boolean(itemId)),
          selectedUserTherapyIds: nextProtocol.items
            .map((item) => item.user_therapy?.id)
            .filter((itemId): itemId is string => Boolean(itemId)),
          schedule: protocolScheduleFromProtocol(nextProtocol),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!protocol) return;
    if (!formState.name.trim()) {
      showError("Enter a stack name.");
      return;
    }
    if (
      formState.selectedUserSupplementIds.length === 0 &&
      formState.selectedUserMedicationIds.length === 0 &&
      formState.selectedUserTherapyIds.length === 0
    ) {
      showError("Stacks need at least one item. Delete the stack if you no longer need it.");
      return;
    }
    const scheduleError = getProtocolScheduleValidationError(formState.schedule);
    if (scheduleError) {
      showError(scheduleError);
      return;
    }

    setSaving(true);
    try {
      await protocolsApi.update(protocol.id, {
        name: formState.name.trim(),
        description: formState.description.trim() || null,
        schedule: buildProtocolSchedule(formState.schedule),
        user_supplement_ids: formState.selectedUserSupplementIds,
        user_medication_ids: formState.selectedUserMedicationIds,
        user_therapy_ids: formState.selectedUserTherapyIds,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to update stack");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!protocol) return;

    setSaving(true);
    try {
      await protocolsApi.remove(protocol.id);
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to delete stack");
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

  if (!protocol) {
    return (
      <View style={styles.centered}>
        <Text>Stack not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="Manage Stack"
        subtitle={protocol.name}
      />

      <ProtocolForm
        state={formState}
        setState={setFormState}
        supplements={supplements}
        medications={medications}
        therapies={therapies}
        saving={saving}
        primaryLabel="Save Stack"
        onSubmit={handleSave}
        secondaryLabel="Delete Stack"
        onSecondaryAction={handleDelete}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
