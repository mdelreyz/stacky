import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useFocusEffect, type Href } from "expo-router";
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
  const [entrance] = useState(() => new Animated.Value(0));

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

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const outOfStockSupplements = mySupplements.filter((item) => item.is_out_of_stock);
  const activeProtocolCount = mySupplements.length + myMedications.length + myTherapies.length + myPeptides.length;
  const visibleCatalogCount =
    supplementCatalog.length + medicationCatalog.length + therapyCatalog.length + peptideCatalog.length;
  const entranceTranslate = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          void fetchData();
        }} />
      }
    >
      <View pointerEvents="none" style={styles.ambientCanvas}>
        <View style={styles.ambientBlueGlow} />
        <View style={styles.ambientCyanGlow} />
        <View style={styles.ambientWarmGlow} />
      </View>

      <Animated.View
        style={{
          opacity: entrance,
          transform: [{ translateY: entranceTranslate }],
        }}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroOrbWarm} />
          <Text style={styles.eyebrow}>Protocol Control Surface</Text>
          <Text style={styles.title}>My Protocols</Text>
          <Text style={styles.subtitle}>
            Supplements, medications, modalities, peptides, and stacks in a calmer, more browseable system.
          </Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{activeProtocolCount}</Text>
              <Text style={styles.heroStatLabel}>Active items</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{stacks.length}</Text>
              <Text style={styles.heroStatLabel}>Stacks</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{visibleCatalogCount}</Text>
              <Text style={styles.heroStatLabel}>Visible catalog</Text>
            </View>
          </View>
        </View>

        <StackScoreCard />

        <View style={styles.aiButtonRow}>
          <Link href="/recommendations" asChild>
            <Pressable
              style={({ pressed }) => [styles.aiButton, pressed && styles.aiButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Recommendations"
            >
              <View style={styles.aiButtonIconWrap}>
                <FontAwesome name="magic" size={16} color={colors.primaryDark} />
              </View>
              <View style={styles.aiButtonBody}>
                <Text style={styles.aiButtonText}>Recommendations</Text>
                <Text style={styles.aiButtonHint}>See what to add, prune, or refill next.</Text>
              </View>
              <FontAwesome name="chevron-right" size={13} color={colors.textPlaceholder} />
            </Pressable>
          </Link>
          <Link href="/wizard" asChild>
            <Pressable
              style={({ pressed }) => [styles.aiButton, pressed && styles.aiButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Guided Wizard"
            >
              <View style={styles.aiButtonIconWrap}>
                <FontAwesome name="comments" size={16} color={colors.primaryDark} />
              </View>
              <View style={styles.aiButtonBody}>
                <Text style={styles.aiButtonText}>Guided Wizard</Text>
                <Text style={styles.aiButtonHint}>Build a protocol path with AI assistance.</Text>
              </View>
              <FontAwesome name="chevron-right" size={13} color={colors.textPlaceholder} />
            </Pressable>
          </Link>
          <Link href="/protocol-templates" asChild>
            <Pressable
              style={({ pressed }) => [styles.aiButton, pressed && styles.aiButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Protocol Library"
            >
              <View style={styles.aiButtonIconWrap}>
                <FontAwesome name="book" size={16} color={colors.primaryDark} />
              </View>
              <View style={styles.aiButtonBody}>
                <Text style={styles.aiButtonText}>Protocol Library</Text>
                <Text style={styles.aiButtonHint}>Browse curated stacks and adopt with one tap.</Text>
              </View>
              <FontAwesome name="chevron-right" size={13} color={colors.textPlaceholder} />
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
            href: `/user-supplement/${item.id}` as Href,
          }))}
        />

        {outOfStockSupplements.length > 0 ? (
          <Link href="/supplement/refill-request" asChild>
            <Pressable
              style={({ pressed }) => [styles.alertCard, pressed && styles.alertCardPressed]}
              accessibilityRole="button"
              accessibilityLabel="View supplements to reorder"
            >
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
            href: `/user-medication/${item.id}` as Href,
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
              href: `/user-therapy/${item.id}` as Href,
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
            href: `/user-peptide/${item.id}` as Href,
          }))}
        />

        <CatalogSearchInput value={search} onChangeText={setSearch} />

        <CatalogSection
          title="Supplements"
          items={supplementCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            href: `/supplement/${item.id}` as Href,
            iconName: "flask",
            badgeLabel: item.source === "catalog" ? "Catalog" : "User-Created",
          }))}
          emptyText="No curated or user-created supplements matched your search."
        />

        <CatalogSection
          title="Medication Catalog"
          items={medicationCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            href: `/medication/${item.id}` as Href,
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
            href: `/therapy/${item.id}` as Href,
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
            href: `/peptide/${item.id}` as Href,
            iconName: "eyedropper",
          }))}
          emptyText="No peptides matched your search."
        />

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 40, position: "relative" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  ambientCanvas: {
    position: "absolute",
    top: -24,
    left: -50,
    right: -50,
    height: 620,
  },
  ambientBlueGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(125,177,225,0.16)",
    top: 0,
    left: -20,
  },
  ambientCyanGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(128,220,225,0.16)",
    top: 180,
    right: -10,
  },
  ambientWarmGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(255,195,128,0.12)",
    top: 300,
    left: 56,
  },
  heroCard: {
    margin: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 28,
    backgroundColor: "rgba(54,94,130,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 3,
    overflow: "hidden",
  },
  heroOrbLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.11)",
    top: -50,
    right: -22,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -28,
    left: -16,
  },
  heroOrbWarm: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -18,
    right: 34,
  },
  eyebrow: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
    marginBottom: 10,
  },
  title: { fontSize: 30, fontWeight: "800", color: colors.textWhite },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.78)", marginTop: 8, lineHeight: 21, maxWidth: "92%" },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textWhite,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  alertCard: {
    backgroundColor: "rgba(248,243,232,0.9)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    shadowColor: colors.warningDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  alertCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
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
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  aiButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  aiButtonIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    marginRight: 12,
  },
  aiButtonBody: {
    flex: 1,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  aiButtonHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
});
