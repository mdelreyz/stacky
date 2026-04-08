import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { ActiveProtocolItemsSection } from "@/components/protocols/ActiveProtocolItemsSection";
import { CatalogSearchInput } from "@/components/protocols/CatalogSearchInput";
import { CatalogSection } from "@/components/protocols/CatalogSection";
import { ProtocolStacksSection } from "@/components/protocols/ProtocolStacksSection";
import {
  medications as medicationsApi,
  protocols as protocolsApi,
  supplements as supplementsApi,
  therapies as therapiesApi,
  userMedications as userMedicationsApi,
  userSupplements as userSupplementsApi,
  userTherapies as userTherapiesApi,
} from "@/lib/api";
import { getFrequencyLabel, getTakeWindowLabel } from "@/lib/schedule";
import { readTherapySettings } from "@/lib/therapy-settings";
import type {
  Medication,
  Protocol,
  Supplement,
  Therapy,
  UserMedication,
  UserSupplement,
  UserTherapy,
} from "@/lib/api";

export default function ProtocolsScreen() {
  const [stacks, setStacks] = useState<Protocol[]>([]);
  const [supplementCatalog, setSupplementCatalog] = useState<Supplement[]>([]);
  const [medicationCatalog, setMedicationCatalog] = useState<Medication[]>([]);
  const [therapyCatalog, setTherapyCatalog] = useState<Therapy[]>([]);
  const [mySupplements, setMySupplements] = useState<UserSupplement[]>([]);
  const [myMedications, setMyMedications] = useState<UserMedication[]>([]);
  const [myTherapies, setMyTherapies] = useState<UserTherapy[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [
        stacksRes,
        supplementCatalogRes,
        medicationCatalogRes,
        therapyCatalogRes,
        mySupplementsRes,
        myMedicationsRes,
        myTherapiesRes,
      ] =
        await Promise.all([
          protocolsApi.list(),
          supplementsApi.list({ search: search || undefined }),
          medicationsApi.list({ search: search || undefined }),
          therapiesApi.list({ search: search || undefined }),
          userSupplementsApi.list(),
          userMedicationsApi.list(),
          userTherapiesApi.list(),
        ]);
      setStacks(stacksRes.items);
      setSupplementCatalog(supplementCatalogRes.items);
      setMedicationCatalog(medicationCatalogRes.items);
      setTherapyCatalog(therapyCatalogRes.items);
      setMySupplements(mySupplementsRes.items);
      setMyMedications(myMedicationsRes.items);
      setMyTherapies(myTherapiesRes.items);
    } catch (error) {
      console.error("Failed to fetch protocol data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          void fetchData();
        }} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Protocols</Text>
        <Text style={styles.subtitle}>
          Supplements, medications, modalities, activities, devices, and named stacks
        </Text>
      </View>

      <ProtocolStacksSection stacks={stacks} />

      <ActiveProtocolItemsSection
        title="Active Supplements"
        actionHref="/supplement/add"
        actionLabel="Add"
        emptyIcon="flask"
        emptyTitle="No supplements added yet"
        emptyHint='Tap "Add" to onboard your first supplement with AI-powered insights.'
        items={mySupplements.map((item) => ({
          id: item.id,
          name: item.supplement.name,
          meta: `${item.dosage_amount}${item.dosage_unit} · ${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
          href: `/user-supplement/${item.id}`,
        }))}
      />

      <ActiveProtocolItemsSection
        title="Active Medications"
        actionHref="/medication/add"
        actionLabel="Add"
        emptyIcon="medkit"
        emptyTitle="No medications added yet"
        emptyHint="Use the medication catalog for prescriptions, topicals, or hair-loss treatments you want tracked separately from supplements."
        items={myMedications.map((item) => ({
          id: item.id,
          name: item.medication.name,
          meta: `${item.dosage_amount}${item.dosage_unit} · ${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
          href: `/user-medication/${item.id}`,
        }))}
      />

      <ActiveProtocolItemsSection
        title="Active Modalities"
        emptyIcon="heartbeat"
        emptyTitle="No modalities added yet"
        emptyHint="Browse the protocol catalog below to schedule therapies, meditation, recovery, training, or device sessions."
        items={myTherapies.map((item) => {
          const settings = readTherapySettings(item.settings);
          return {
            id: item.id,
            name: item.therapy.name,
            meta: `${item.duration_minutes ? `${item.duration_minutes} min · ` : ""}${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
            detail: settings.sessionDetails || settings.lastSessionDetails || undefined,
            href: `/user-therapy/${item.id}`,
          };
        })}
      />

      <CatalogSearchInput value={search} onChangeText={setSearch} />

      <CatalogSection
        title="Supplement Catalog"
        items={supplementCatalog.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          href: `/supplement/${item.id}`,
          iconName: "flask",
          badgeLabel: item.ai_profile ? "AI" : undefined,
        }))}
        emptyText="No supplements matched your search."
      />

      <CatalogSection
        title="Medication Catalog"
        items={medicationCatalog.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          href: `/medication/${item.id}`,
          iconName: "medkit",
        }))}
        emptyText="No medications matched your search."
      />

      <CatalogSection
        title="Modality Catalog"
        items={therapyCatalog.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category.replace(/_/g, " "),
          href: `/therapy/${item.id}`,
          iconName: "heartbeat",
        }))}
        emptyText="No modalities matched your search."
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "700", color: "#212529" },
  subtitle: { fontSize: 14, color: "#6c757d", marginTop: 4 },
});
