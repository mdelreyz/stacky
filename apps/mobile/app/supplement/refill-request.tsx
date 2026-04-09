import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { userSupplements as userSupplementsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { SupplementRefillRequest } from "@/lib/api";

export default function SupplementRefillRequestScreen() {
  const [refillRequest, setRefillRequest] = useState<SupplementRefillRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    userSupplementsApi
      .getRefillRequest()
      .then((response) => {
        if (!cancelled) {
          setRefillRequest(response);
        }
      })
      .catch(() => showError("Failed to load refill request"))
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title="Supplement Refill Note" subtitle="Generated from active supplements marked out of stock" />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Needed Items</Text>
        {refillRequest?.items.length ? (
          refillRequest.items.map((item) => (
            <View key={item.user_supplement_id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.supplement_name}</Text>
              <Text style={styles.itemMeta}>
                {item.dosage_amount}
                {item.dosage_unit} · {item.frequency.replace(/_/g, " ")} · {item.take_window.replace(/_/g, " ")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No supplements are currently marked out of stock.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Generated Text</Text>
        <Text style={styles.generatedText}>{refillRequest?.text ?? ""}</Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.grayDark,
    marginBottom: 12,
  },
  itemRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  generatedText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
