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
  protocols as protocolsApi,
  userSupplements as userSupplementsApi,
  userTherapies as userTherapiesApi,
} from "@/lib/api";
import { showError } from "@/lib/errors";
import type { Protocol, UserSupplement, UserTherapy } from "@/lib/api";

export default function ManageProtocolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [supplements, setSupplements] = useState<UserSupplement[]>([]);
  const [therapies, setTherapies] = useState<UserTherapy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<ProtocolFormState>({
    name: "",
    description: "",
    selectedUserSupplementIds: [],
    selectedUserTherapyIds: [],
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    Promise.all([protocolsApi.get(id), userSupplementsApi.list(false), userTherapiesApi.list(false)])
      .then(([nextProtocol, supplementsResponse, therapiesResponse]) => {
        if (cancelled) return;
        setProtocol(nextProtocol);
        setSupplements(supplementsResponse.items);
        setTherapies(therapiesResponse.items);
        setFormState({
          name: nextProtocol.name,
          description: nextProtocol.description || "",
          selectedUserSupplementIds: nextProtocol.items
            .map((item) => item.user_supplement?.id)
            .filter((itemId): itemId is string => Boolean(itemId)),
          selectedUserTherapyIds: nextProtocol.items
            .map((item) => item.user_therapy?.id)
            .filter((itemId): itemId is string => Boolean(itemId)),
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
    if (!protocol) return;
    if (!formState.name.trim()) {
      showError("Enter a stack name.");
      return;
    }
    if (
      formState.selectedUserSupplementIds.length === 0 &&
      formState.selectedUserTherapyIds.length === 0
    ) {
      showError("Stacks need at least one item. Delete the stack if you no longer need it.");
      return;
    }

    setSaving(true);
    try {
      await protocolsApi.update(protocol.id, {
        name: formState.name.trim(),
        description: formState.description.trim() || null,
        user_supplement_ids: formState.selectedUserSupplementIds,
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
