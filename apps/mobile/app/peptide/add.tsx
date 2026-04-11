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
import { peptides as peptidesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import type { Peptide } from "@/lib/api";

const CATEGORIES: Array<{ value: string | null; label: string }> = [
  { value: null, label: "All" },
  { value: "research", label: "Research" },
  { value: "therapeutic", label: "Therapeutic" },
  { value: "cosmetic", label: "Cosmetic" },
  { value: "performance", label: "Performance" },
  { value: "recovery", label: "Recovery" },
  { value: "other", label: "Other" },
];

const CATEGORY_ICONS: Record<string, string> = {
  research: "flask",
  therapeutic: "medkit",
  cosmetic: "star",
  performance: "rocket",
  recovery: "heartbeat",
  other: "ellipsis-h",
};

export default function AddPeptideScreen() {
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<Peptide[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const trimmedSearch = search.trim();
  const deferredSearch = useDeferredValue(trimmedSearch);

  useEffect(() => {
    let cancelled = false;

    setCatalogLoading(true);
    void peptidesApi
      .list({
        search: deferredSearch || undefined,
        category: activeCategory ?? undefined,
      })
      .then((result) => {
        if (!cancelled) setCatalog(result.items);
      })
      .catch((error: any) => {
        if (!cancelled) showError(error.message || "Failed to load peptide catalog");
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
          title="Add Peptide"
          subtitle="Browse and add research, therapeutic, or performance peptides"
        />

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <FontAwesome name="search" size={16} color={colors.primaryDark} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search peptides..."
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
            <FontAwesome name="eyedropper" size={12} color={colors.primaryDark} />
            <Text style={styles.metaPillText}>
              {catalogLoading ? "Loading..." : `${catalog.length} peptides`}
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
            <FontAwesome name="eyedropper" size={24} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No peptides found</Text>
            <Text style={styles.emptyBody}>
              {trimmedSearch
                ? `No peptides match "${trimmedSearch}". Try a different search term.`
                : "No peptides available in this category."}
            </Text>
          </View>
        ) : (
          catalog.map((peptide) => (
            <Pressable
              key={peptide.id}
              style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
              onPress={() => router.push(`/peptide/${peptide.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${peptide.name}`}
            >
              <View style={styles.itemIconWrap}>
                <FontAwesome
                  name={(CATEGORY_ICONS[peptide.category] ?? "eyedropper") as any}
                  size={16}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{peptide.name}</Text>
                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemMeta}>{snakeCaseToLabel(peptide.category)}</Text>
                  {peptide.form ? (
                    <Text style={styles.itemMeta}> · {peptide.form}</Text>
                  ) : null}
                </View>
                {peptide.description ? (
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {peptide.description}
                  </Text>
                ) : null}
                <View style={styles.badgeRow}>
                  {peptide.is_verified ? (
                    <View style={[styles.badge, styles.badgeSuccess]}>
                      <FontAwesome name="check" size={10} color={colors.success} />
                      <Text style={styles.badgeSuccessText}>Verified</Text>
                    </View>
                  ) : null}
                  {peptide.ai_profile ? (
                    <View style={[styles.badge, styles.badgeInfo]}>
                      <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
                      <Text style={styles.badgeInfoText}>Profile</Text>
                    </View>
                  ) : null}
                  {(peptide.goals ?? []).slice(0, 2).map((goal) => (
                    <View key={goal} style={[styles.badge, styles.badgeGoal]}>
                      <Text style={styles.badgeGoalText}>{snakeCaseToLabel(goal)}</Text>
                    </View>
                  ))}
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
              Browse or search the peptide catalog above
            </Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>2</Text>
            </View>
            <Text style={styles.infoStepText}>
              Tap a peptide to view dosage, route, cycling, and safety info
            </Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>3</Text>
            </View>
            <Text style={styles.infoStepText}>
              Press "Add to My Protocol" to set dosage, route, and schedule
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
  itemMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  itemMeta: { fontSize: 12, color: colors.textSecondary },
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
  badgeSuccess: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBadge,
  },
  badgeSuccessText: { fontSize: 11, fontWeight: "700", color: colors.success },
  badgeGoal: {
    backgroundColor: colors.badgeYellowLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  badgeGoalText: { fontSize: 11, fontWeight: "700", color: colors.warningDark },
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
