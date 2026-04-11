import { useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { therapies as therapiesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import type { Therapy } from "@/lib/api";

const CATEGORIES: Array<{ value: string | null; label: string }> = [
  { value: null, label: "All" },
  { value: "thermal", label: "Thermal" },
  { value: "light", label: "Light" },
  { value: "movement", label: "Movement" },
  { value: "breathwork", label: "Breathwork" },
  { value: "electrical", label: "Electrical" },
  { value: "manual", label: "Manual" },
  { value: "sound", label: "Sound" },
  { value: "skincare", label: "Skincare" },
  { value: "haircare", label: "Haircare" },
  { value: "recovery", label: "Recovery" },
  { value: "cognitive", label: "Cognitive" },
  { value: "other", label: "Other" },
];

const CATEGORY_ICONS: Record<string, string> = {
  thermal: "fire",
  light: "sun-o",
  movement: "child",
  breathwork: "leaf",
  electrical: "bolt",
  manual: "hand-paper-o",
  sound: "music",
  skincare: "star",
  haircare: "scissors",
  recovery: "medkit",
  cognitive: "lightbulb-o",
  other: "ellipsis-h",
};

export default function AddTherapyScreen() {
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<Therapy[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const trimmedSearch = search.trim();
  const deferredSearch = useDeferredValue(trimmedSearch);

  useEffect(() => {
    let cancelled = false;

    setCatalogLoading(true);
    void therapiesApi
      .list({
        search: deferredSearch || undefined,
        category: activeCategory ?? undefined,
      })
      .then((result) => {
        if (!cancelled) setCatalog(result.items);
      })
      .catch((error: any) => {
        if (!cancelled) showError(error.message || "Failed to load therapy catalog");
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, activeCategory]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Add Modality"
          subtitle="Browse and add therapies, recovery protocols, and device sessions"
        />

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <FontAwesome name="search" size={16} color={colors.primaryDark} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search modalities..."
              placeholderTextColor={colors.textPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {trimmedSearch ? (
              <Pressable
                onPress={() => setSearch("")}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <FontAwesome name="times-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value ?? "all"}
              style={({ pressed }) => [
                styles.categoryChip,
                activeCategory === cat.value && styles.categoryChipActive,
                pressed && styles.chipPressed,
              ]}
              onPress={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
              accessibilityState={{ selected: activeCategory === cat.value }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  activeCategory === cat.value && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <FontAwesome name="heartbeat" size={12} color={colors.primaryDark} />
            <Text style={styles.metaPillText}>
              {catalogLoading ? "Loading..." : `${catalog.length} modalities`}
            </Text>
          </View>
          {activeCategory ? (
            <View style={styles.metaPill}>
              <FontAwesome name="filter" size={12} color={colors.accent} />
              <Text style={styles.metaPillText}>{snakeCaseToLabel(activeCategory)}</Text>
            </View>
          ) : null}
        </View>

        {catalogLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : catalog.length === 0 ? (
          <View style={styles.emptyCard}>
            <FontAwesome name="heartbeat" size={24} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No modalities found</Text>
            <Text style={styles.emptyBody}>
              {trimmedSearch
                ? `No modalities match "${trimmedSearch}". Try a different search term.`
                : "No modalities available in this category."}
            </Text>
          </View>
        ) : (
          catalog.map((therapy) => (
            <Pressable
              key={therapy.id}
              style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
              onPress={() => router.push(`/therapy/${therapy.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${therapy.name}`}
            >
              <View style={styles.itemIconWrap}>
                <FontAwesome
                  name={(CATEGORY_ICONS[therapy.category] ?? "heartbeat") as any}
                  size={16}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{therapy.name}</Text>
                <Text style={styles.itemMeta}>{snakeCaseToLabel(therapy.category)}</Text>
                {therapy.description ? (
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {therapy.description}
                  </Text>
                ) : null}
                <View style={styles.badgeRow}>
                  {therapy.ai_profile ? (
                    <View style={[styles.badge, styles.badgeInfo]}>
                      <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
                      <Text style={styles.badgeInfoText}>Profile</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
            </Pressable>
          ))
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>1</Text>
            </View>
            <Text style={styles.infoStepText}>
              Browse or search the modality catalog above
            </Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>2</Text>
            </View>
            <Text style={styles.infoStepText}>
              Tap a modality to view its full profile and details
            </Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>3</Text>
            </View>
            <Text style={styles.infoStepText}>
              Press "Start Protocol" to set duration, frequency, and schedule
            </Text>
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 36, position: "relative" },
  backdrop: { top: -48, height: 1040 },
  centered: { padding: 40, alignItems: "center" },
  searchCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  categoryScroll: { marginBottom: 12 },
  categoryScrollContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  categoryChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  chipPressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  categoryChipTextActive: { color: colors.primaryDark },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textSecondary },
  emptyBody: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  itemCardPressed: { opacity: 0.94, transform: [{ scale: 0.988 }] },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  itemMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  itemDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeInfo: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  badgeInfoText: { fontSize: 11, fontWeight: "700", color: colors.primaryDark },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 14,
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  infoStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoStepNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  infoStepText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
