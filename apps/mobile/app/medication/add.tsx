import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { CatalogSearchInput } from "@/components/protocols/CatalogSearchInput";
import { CatalogSection } from "@/components/protocols/CatalogSection";
import { medications as medicationsApi } from "@/lib/api";
import type { Medication } from "@/lib/api";

export default function AddMedicationScreen() {
  const [search, setSearch] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    medicationsApi
      .list({ search: search || undefined })
      .then((response) => {
        if (!cancelled) {
          setMedications(response.items);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

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
        title="Medication Catalog"
        subtitle="Browse prescriptions, topicals, and other tracked medications"
      />

      <CatalogSearchInput value={search} onChangeText={setSearch} />
      <CatalogSection
        title="Medications"
        items={medications.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          href: `/medication/${item.id}`,
          iconName: "medkit",
        }))}
        emptyText="No medications matched your search."
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
