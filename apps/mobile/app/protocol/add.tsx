import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { ProtocolForm, type ProtocolFormState } from "@/components/ProtocolForm";
import { protocols as protocolsApi, userSupplements as userSupplementsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { UserSupplement } from "@/lib/api";

export default function AddProtocolScreen() {
  const [supplements, setSupplements] = useState<UserSupplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<ProtocolFormState>({
    name: "",
    description: "",
    selectedUserSupplementIds: [],
  });

  useEffect(() => {
    let cancelled = false;
    userSupplementsApi
      .list()
      .then((response) => {
        if (cancelled) return;
        setSupplements(response.items);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!formState.name.trim()) {
      showError("Enter a stack name.");
      return;
    }
    if (formState.selectedUserSupplementIds.length === 0) {
      showError("Select at least one supplement for this stack.");
      return;
    }

    setSaving(true);
    try {
      await protocolsApi.create({
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        user_supplement_ids: formState.selectedUserSupplementIds,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to create stack");
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

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="New Stack"
        subtitle="Group active supplements into one named protocol"
      />

      {supplements.length === 0 ? (
        <View style={styles.emptyCard}>
          <FontAwesome name="flask" size={36} color="#dee2e6" />
          <Text style={styles.emptyTitle}>No active supplements yet</Text>
          <Text style={styles.emptyText}>
            Add supplements to your protocol first, then bundle them into a stack here.
          </Text>
        </View>
      ) : (
        <ProtocolForm
          state={formState}
          setState={setFormState}
          supplements={supplements}
          saving={saving}
          primaryLabel="Create Stack"
          onSubmit={handleSave}
        />
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginTop: 14,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#868e96",
    textAlign: "center",
    marginTop: 8,
  },
});
