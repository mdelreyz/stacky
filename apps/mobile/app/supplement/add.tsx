import { useDeferredValue, useEffect, useState, type ComponentProps } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { supplements as supplementsApi, type Supplement } from "@/lib/api";
import { showError } from "@/lib/errors";

type IconName = ComponentProps<typeof FontAwesome>["name"];

const FEATURE_ITEMS: Array<{ icon: IconName; label: string }> = [
  { icon: "bolt", label: "Mechanism of action" },
  { icon: "clock-o", label: "Timing and dosage" },
  { icon: "exchange", label: "Interactions and synergies" },
  { icon: "shield", label: "Safety and contraindications" },
  { icon: "line-chart", label: "Cycling guidance" },
  { icon: "tint", label: "Absorption and bioavailability" },
];

function formatCategory(category: Supplement["category"]) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sourceLabel(item: Supplement) {
  return item.source === "catalog" ? "Catalog" : "User-Created";
}

function aiBadgeLabel(item: Supplement) {
  if (item.ai_profile) return "AI Ready";
  if (item.ai_status === "generating") return "Generating";
  if (item.ai_status === "failed") return "Needs Retry";
  return "Profile Pending";
}

export default function AddSupplementScreen() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<Supplement[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Supplement[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [entrance] = useState(() => new Animated.Value(0));

  const trimmedName = name.trim();
  const deferredName = useDeferredValue(trimmedName);

  useEffect(() => {
    let cancelled = false;

    void supplementsApi
      .list()
      .then((result) => {
        if (cancelled) return;
        setCatalog(result.items);
      })
      .catch((error: any) => {
        if (cancelled) return;
        showError(error.message || "Failed to load supplement catalog");
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    if (deferredName.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    setSuggestionsLoading(true);

    void supplementsApi
      .list({ search: deferredName })
      .then((result) => {
        if (cancelled) return;
        setSuggestions(result.items.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredName]);

  const handleOnboard = async () => {
    if (!trimmedName) return;
    setLoading(true);
    try {
      const result = await supplementsApi.onboard({ name: trimmedName });
      if (result.status === "failed" && result.ai_error) {
        showError(result.ai_error);
      }
      router.replace(`/supplement/${result.id}`);
    } catch (e: any) {
      showError(e.message || "Failed to onboard supplement");
    } finally {
      setLoading(false);
    }
  };

  const exactMatch =
    suggestions.find((item) => item.name.toLowerCase() === trimmedName.toLowerCase())
    || catalog.find((item) => item.name.toLowerCase() === trimmedName.toLowerCase())
    || null;

  const categories = [...new Set(catalog.map((item) => formatCategory(item.category)))].sort();
  const browseItems = activeCategory
    ? catalog.filter((item) => formatCategory(item.category) === activeCategory)
    : catalog;
  const browsePreview = browseItems.slice(0, 8);
  const entranceTranslate = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesome name="arrow-left" size={18} color={colors.textWhite} />
          </Pressable>
          <Text style={styles.title}>Add Supplement</Text>
        </View>
        <Text style={styles.heroHeadline}>Search first, then create only when you need something new.</Text>
        <Text style={styles.heroCopy}>
          Live catalog matches appear while you type. Tap a suggestion to jump straight into an existing profile,
          or keep your wording and we&apos;ll create a private user-created supplement for you.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.catalogButton, pressed && styles.softPressed]}
          onPress={() => router.push("/(tabs)/protocols")}
          accessibilityRole="button"
          accessibilityLabel="Visit supplement catalog"
        >
          <FontAwesome name="compass" size={14} color={colors.textWhite} />
          <Text style={styles.catalogButtonText}>Visit Catalog</Text>
        </Pressable>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchGlyph}>
          <FontAwesome name="search" size={16} color={colors.primaryDark} />
        </View>
        <View style={styles.searchBody}>
          <Text style={styles.label}>Supplement Name</Text>
          <Text style={styles.searchHint}>
            Start with at least two letters to search the curated catalog and your private supplements.
          </Text>
        </View>
      </View>

      <View style={styles.searchInputCard}>
        <TextInput
          style={styles.input}
          placeholder="e.g., Ashwagandha KSM-66"
          placeholderTextColor={colors.textPlaceholder}
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={handleOnboard}
        />
        {trimmedName ? (
          <Pressable
            style={({ pressed }) => [styles.clearButton, pressed && styles.iconButtonPressed]}
            onPress={() => setName("")}
            accessibilityRole="button"
            accessibilityLabel="Clear supplement search"
          >
            <FontAwesome name="times-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <FontAwesome name="database" size={12} color={colors.primaryDark} />
          <Text style={styles.metaPillText}>
            {catalogLoading ? "Loading catalog..." : `${catalog.length} items ready to browse`}
          </Text>
        </View>
        {exactMatch ? (
          <View style={styles.metaPill}>
            <FontAwesome name="check-circle" size={12} color={colors.success} />
            <Text style={styles.metaPillText}>Exact match found</Text>
          </View>
        ) : trimmedName ? (
          <View style={styles.metaPill}>
            <FontAwesome name="star-o" size={12} color={colors.warningDark} />
            <Text style={styles.metaPillText}>Create as user-created if missing</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        {suggestionsLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {trimmedName.length < 2 ? (
        <View style={styles.emptyGlassCard}>
          <FontAwesome name="keyboard-o" size={18} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Start typing to search the catalog</Text>
          <Text style={styles.emptyBody}>
            We&apos;ll surface supplements whose names contain your text, then let you jump into the best match.
          </Text>
        </View>
      ) : suggestions.length > 0 ? (
        suggestions.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.glassResultCard, pressed && styles.softPressedCard]}
            onPress={() => router.push(`/supplement/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
          >
            <View style={styles.resultIconWrap}>
              <FontAwesome name="flask" size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultMeta}>{formatCategory(item.category)}</Text>
              <View style={styles.resultBadgeRow}>
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceBadgeText}>{sourceLabel(item)}</Text>
                </View>
                <View style={[styles.sourceBadge, styles.aiBadge]}>
                  <Text style={[styles.sourceBadgeText, styles.aiBadgeText]}>{aiBadgeLabel(item)}</Text>
                </View>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyGlassCard}>
          <FontAwesome name="magic" size={18} color={colors.warningDark} />
          <Text style={styles.emptyTitle}>No matching catalog entry yet</Text>
          <Text style={styles.emptyBody}>
            Press the primary button below and we&apos;ll create <Text style={styles.emptyBodyStrong}>{trimmedName}</Text> as a
            user-created supplement.
          </Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.onboardButton,
          (!trimmedName || loading) && styles.onboardButtonDisabled,
          pressed && trimmedName && !loading && styles.softPressed,
        ]}
        onPress={handleOnboard}
        disabled={!trimmedName || loading}
        accessibilityRole="button"
        accessibilityLabel={exactMatch ? "Use matching supplement" : "Find or generate profile"}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name={exactMatch ? "arrow-right" : "magic"} size={16} color={colors.white} />
            <Text style={styles.onboardButtonText}>
              {exactMatch ? "Use Matching Supplement" : "Find or Generate Profile"}
            </Text>
          </>
        )}
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse Catalog</Text>
        <Pressable
          style={({ pressed }) => [styles.inlineCatalogButton, pressed && styles.softPressed]}
          onPress={() => router.push("/(tabs)/protocols")}
          accessibilityRole="button"
          accessibilityLabel="Open full supplement catalog"
        >
          <Text style={styles.inlineCatalogButtonText}>Visit Catalog</Text>
        </Pressable>
      </View>

      {categories.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <Pressable
            style={({ pressed }) => [
              styles.categoryChip,
              !activeCategory && styles.categoryChipActive,
              pressed && styles.chipPressed,
            ]}
            onPress={() => setActiveCategory(null)}
            accessibilityRole="button"
            accessibilityLabel="All supplement categories"
            accessibilityState={{ selected: !activeCategory }}
          >
            <Text style={[styles.categoryChipText, !activeCategory && styles.categoryChipTextActive]}>All</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={({ pressed }) => [
                styles.categoryChip,
                activeCategory === category && styles.categoryChipActive,
                pressed && styles.chipPressed,
              ]}
              onPress={() => setActiveCategory(activeCategory === category ? null : category)}
              accessibilityRole="button"
              accessibilityLabel={category}
              accessibilityState={{ selected: activeCategory === category }}
            >
              <Text style={[styles.categoryChipText, activeCategory === category && styles.categoryChipTextActive]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {catalogLoading ? (
        <View style={styles.emptyGlassCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.emptyTitle}>Loading browseable catalog</Text>
        </View>
      ) : browsePreview.length > 0 ? (
        browsePreview.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.browseCard, pressed && styles.softPressedCard]}
            onPress={() => router.push(`/supplement/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
          >
            <View style={styles.browseTopRow}>
              <View style={styles.browseCategoryPill}>
                <Text style={styles.browseCategoryPillText}>{formatCategory(item.category)}</Text>
              </View>
              <Text style={styles.browseSourceText}>{sourceLabel(item)}</Text>
            </View>
            <Text style={styles.browseName}>{item.name}</Text>
            <Text style={styles.browseStatus}>{aiBadgeLabel(item)}</Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyGlassCard}>
          <FontAwesome name="database" size={18} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No supplements available to browse</Text>
        </View>
      )}

      <View style={styles.featuresCard}>
        <Text style={styles.sectionTitle}>What the profile covers</Text>
        <View style={styles.featureGrid}>
          {FEATURE_ITEMS.map((item) => (
            <View key={item.label} style={styles.featureTile}>
              <View style={styles.featureIconWrap}>
                <FontAwesome name={item.icon} size={14} color={colors.primaryDark} />
              </View>
              <Text style={styles.featureLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 36, position: "relative" },
  ambientCanvas: {
    position: "absolute",
    top: -28,
    left: -56,
    right: -56,
    height: 700,
  },
  ambientBlueGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(125,177,225,0.16)",
    top: 0,
    left: -18,
  },
  ambientCyanGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(128,220,225,0.16)",
    top: 210,
    right: -8,
  },
  ambientWarmGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    top: 360,
    left: 60,
  },
  heroCard: {
    margin: 16,
    marginBottom: 14,
    padding: 18,
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
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -56,
    right: -24,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -30,
    left: -18,
  },
  heroOrbWarm: {
    position: "absolute",
    width: 144,
    height: 144,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -20,
    right: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  backButton: { padding: 8, borderRadius: 999 },
  iconButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.textWhite },
  heroHeadline: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.textWhite,
    marginBottom: 10,
    maxWidth: "88%",
  },
  heroCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.82)",
    marginBottom: 16,
    maxWidth: "92%",
  },
  catalogButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  softPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  catalogButtonText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  searchBody: { flex: 1 },
  searchGlyph: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  label: { fontSize: 14, fontWeight: "700", color: colors.textSecondary, marginBottom: 4 },
  searchHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  searchInputCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    paddingLeft: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 18,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  emptyGlassCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "flex-start",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  emptyBodyStrong: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  glassResultCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 2,
  },
  softPressedCard: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  resultIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
    marginRight: 10,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  resultMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.info,
  },
  aiBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  aiBadgeText: {
    color: colors.primaryDark,
  },
  onboardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3,
    gap: 8,
  },
  onboardButtonDisabled: { opacity: 0.5 },
  onboardButtonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  inlineCatalogButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  inlineCatalogButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  categoryScroll: {
    marginBottom: 12,
  },
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
  chipPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.primaryDark,
  },
  browseCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  browseTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  browseCategoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.badgeYellowLight,
  },
  browseCategoryPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warningDark,
  },
  browseSourceText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  browseName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  browseStatus: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  featuresCard: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  featureTile: {
    width: "48%",
    minHeight: 88,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(240,244,248,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
