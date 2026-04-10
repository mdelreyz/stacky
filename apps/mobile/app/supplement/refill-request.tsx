import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title="Supplement Refill Note" subtitle="Generated from active supplements marked out of stock" />

        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>Inventory</Text>
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
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>Output</Text>
            <Text style={styles.sectionTitle}>Generated Text</Text>
            <Text style={styles.generatedText}>{refillRequest?.text ?? ""}</Text>
          </View>
        </View>
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1040 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  section: { paddingHorizontal: 16, marginTop: 16 },
  card: {
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
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.grayDark,
    marginBottom: 12,
  },
  itemRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(229,236,242,0.84)",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  generatedText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
