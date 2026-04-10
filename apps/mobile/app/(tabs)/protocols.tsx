import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { ActiveProtocolItemsSection } from "@/components/protocols/ActiveProtocolItemsSection";
import { CatalogSearchInput } from "@/components/protocols/CatalogSearchInput";
import { CatalogSection } from "@/components/protocols/CatalogSection";
import { ProtocolStacksSection } from "@/components/protocols/ProtocolStacksSection";
import { StackScoreCard } from "@/components/protocols/StackScoreCard";
import {
  medications as medicationsApi,
  peptides as peptidesApi,
  protocols as protocolsApi,
  supplements as supplementsApi,
  therapies as therapiesApi,
  userMedications as userMedicationsApi,
  userPeptides as userPeptidesApi,
  userSupplements as userSupplementsApi,
  userTherapies as userTherapiesApi,
} from "@/lib/api";
import { cached } from "@/lib/cache";
import { showError } from "@/lib/errors";
import { getFrequencyLabel, getTakeWindowLabel } from "@/lib/schedule";
import { describeTherapySettings, formatLastCompletedAt, readTherapySettings } from "@/lib/therapy-settings";
import type {
  Medication,
  Peptide,
  Protocol,
  Supplement,
  Therapy,
  UserMedication,
  UserPeptide,
  UserSupplement,
  UserTherapy,
} from "@/lib/api";

export default function ProtocolsScreen() {
  const [stacks, setStacks] = useState<Protocol[]>([]);
  const [supplementCatalog, setSupplementCatalog] = useState<Supplement[]>([]);
  const [medicationCatalog, setMedicationCatalog] = useState<Medication[]>([]);
  const [therapyCatalog, setTherapyCatalog] = useState<Therapy[]>([]);
  const [peptideCatalog, setPeptideCatalog] = useState<Peptide[]>([]);
  const [mySupplements, setMySupplements] = useState<UserSupplement[]>([]);
  const [myMedications, setMyMedications] = useState<UserMedication[]>([]);
  const [myTherapies, setMyTherapies] = useState<UserTherapy[]>([]);
  const [myPeptides, setMyPeptides] = useState<UserPeptide[]>([]);
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
        peptideCatalogRes,
        mySupplementsRes,
        myMedicationsRes,
        myTherapiesRes,
        myPeptidesRes,
      ] =
        await Promise.allSettled([
          cached("protocols:stacks", () => protocolsApi.list()),
          cached(`catalog:supplements:${search}`, () => supplementsApi.list({ search: search || undefined })),
          cached(`catalog:medications:${search}`, () => medicationsApi.list({ search: search || undefined })),
          cached(`catalog:therapies:${search}`, () => therapiesApi.list({ search: search || undefined })),
          cached(`catalog:peptides:${search}`, () => peptidesApi.list({ search: search || undefined })),
          cached("user:supplements", () => userSupplementsApi.list()),
          cached("user:medications", () => userMedicationsApi.list()),
          cached("user:therapies", () => userTherapiesApi.list()),
          cached("user:peptides", () => userPeptidesApi.list()),
        ]);
      if (stacksRes.status === "fulfilled") setStacks(stacksRes.value.items);
      if (supplementCatalogRes.status === "fulfilled") setSupplementCatalog(supplementCatalogRes.value.items);
      if (medicationCatalogRes.status === "fulfilled") setMedicationCatalog(medicationCatalogRes.value.items);
      if (therapyCatalogRes.status === "fulfilled") setTherapyCatalog(therapyCatalogRes.value.items);
      if (peptideCatalogRes.status === "fulfilled") setPeptideCatalog(peptideCatalogRes.value.items);
      if (mySupplementsRes.status === "fulfilled") setMySupplements(mySupplementsRes.value.items);
      if (myMedicationsRes.status === "fulfilled") setMyMedications(myMedicationsRes.value.items);
      if (myTherapiesRes.status === "fulfilled") setMyTherapies(myTherapiesRes.value.items);
      if (myPeptidesRes.status === "fulfilled") setMyPeptides(myPeptidesRes.value.items);
      const allRejected = [stacksRes, supplementCatalogRes, medicationCatalogRes, therapyCatalogRes, peptideCatalogRes, mySupplementsRes, myMedicationsRes, myTherapiesRes, myPeptidesRes].every((r) => r.status === "rejected");
      if (allRejected) showError("Failed to load protocols");
    } catch (error) {
      showError("Failed to load protocols");
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const outOfStockSupplements = mySupplements.filter((item) => item.is_out_of_stock);

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

      <StackScoreCard />

      <View style={styles.aiButtonRow}>
        <Link href="/recommendations" asChild>
          <Pressable style={styles.aiButton}>
            <FontAwesome name="magic" size={16} color={colors.primary} />
            <Text style={styles.aiButtonText}>Recommendations</Text>
          </Pressable>
        </Link>
        <Link href="/wizard" asChild>
          <Pressable style={styles.aiButton}>
            <FontAwesome name="comments" size={16} color={colors.primary} />
            <Text style={styles.aiButtonText}>Guided Wizard</Text>
          </Pressable>
        </Link>
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
          detail: item.is_out_of_stock ? "Out of stock · included in refill note" : undefined,
          href: `/user-supplement/${item.id}`,
        }))}
      />

      {outOfStockSupplements.length > 0 ? (
        <Link href="/supplement/refill-request" asChild>
          <Pressable style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <FontAwesome name="shopping-bag" size={16} color={colors.warning} />
              <Text style={styles.alertTitle}>Supplements To Reorder</Text>
            </View>
            <Text style={styles.alertBody}>
              {outOfStockSupplements.length} active supplement
              {outOfStockSupplements.length === 1 ? "" : "s"} marked out of stock. Open the generated refill note for your next doctor or ordering request.
            </Text>
          </Pressable>
        </Link>
      ) : null}

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
          const lastCompletedAt = formatLastCompletedAt(settings.lastCompletedAt);
          return {
            id: item.id,
            name: item.therapy.name,
            meta: `${item.duration_minutes ? `${item.duration_minutes} min · ` : ""}${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
            detail: lastCompletedAt
              ? `${describeTherapySettings(item.settings) ?? "Session tracked"} · Last done ${lastCompletedAt}`
              : describeTherapySettings(item.settings),
            href: `/user-therapy/${item.id}`,
          };
        })}
      />

      <ActiveProtocolItemsSection
        title="Active Peptides"
        emptyIcon="eyedropper"
        emptyTitle="No peptides added yet"
        emptyHint="Browse the peptide catalog below to add research peptides, therapeutic peptides, or performance compounds."
        items={myPeptides.map((item) => ({
          id: item.id,
          name: item.peptide.name,
          meta: `${item.dosage_amount}${item.dosage_unit}${item.route ? ` · ${item.route}` : ""} · ${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
          href: `/user-peptide/${item.id}`,
        }))}
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
        categoryFilter
        items={therapyCatalog.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category.replace(/_/g, " "),
          href: `/therapy/${item.id}`,
          iconName: "heartbeat",
        }))}
        emptyText="No modalities matched your search."
      />

      <CatalogSection
        title="Peptide Catalog"
        categoryFilter
        items={peptideCatalog.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category.replace(/_/g, " "),
          href: `/peptide/${item.id}`,
          iconName: "eyedropper",
        }))}
        emptyText="No peptides matched your search."
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.gray, marginTop: 4 },
  alertCard: {
    backgroundColor: colors.warningLight,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.warning,
  },
  alertBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  aiButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  aiButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
});
