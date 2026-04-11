import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { protocolTemplates as templatesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { ProtocolTemplateListItem } from "@/lib/api";

const CATEGORIES = [
  { value: null, label: "All" },
  { value: "starter", label: "Starter" },
  { value: "longevity", label: "Longevity" },
  { value: "sleep", label: "Sleep" },
  { value: "cognitive", label: "Cognitive" },
  { value: "energy", label: "Energy" },
  { value: "immune", label: "Immune" },
  { value: "recovery", label: "Recovery" },
  { value: "skin", label: "Skin & Hair" },
  { value: "gut", label: "Gut" },
  { value: "cardiovascular", label: "Heart" },
] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: colors.success,
  intermediate: colors.warning,
  advanced: colors.danger,
};

const CATEGORY_ICONS: Record<string, string> = {
  longevity: "heartbeat",
  sleep: "moon-o",
  cognitive: "bolt",
  energy: "flash",
  immune: "shield",
  recovery: "medkit",
  skin: "star",
  gut: "leaf",
  cardiovascular: "heart",
  starter: "rocket",
  hormonal: "flask",
};

export default function ProtocolTemplatesScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ProtocolTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadTemplates = useCallback(async (category?: string | null) => {
    setLoading(true);
    try {
      const data = await templatesApi.list({
        category: category ?? undefined,
      });
      setTemplates(data);
    } catch (error: any) {
      showError(error.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTemplates(selectedCategory);
    }, [loadTemplates, selectedCategory])
  );

  const handleAdopt = async (template: ProtocolTemplateListItem) => {
    setAdopting(template.id);
    try {
      const result = await templatesApi.adopt(template.id);
      Alert.alert(
        "Protocol Created",
        `${result.message}\n\n${result.items_created} new items added, ${result.items_existing} already in your stack.`,
        [
          { text: "View Protocol", onPress: () => router.push(`/protocol/${result.protocol_id}` as any) },
          { text: "OK" },
        ]
      );
    } catch (error: any) {
      showError(error.message || "Failed to adopt template");
    } finally {
      setAdopting(null);
    }
  };

  const featured = templates.filter((t) => t.is_featured);
  const rest = templates.filter((t) => !t.is_featured);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Protocol Library"
          subtitle="Evidence-based stacks you can adopt with one tap"
        />

        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <Pressable
                key={cat.value ?? "all"}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat.label}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyCard}>
            <FontAwesome name="inbox" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No templates in this category yet.</Text>
          </View>
        ) : (
          <>
            {/* Featured section */}
            {featured.length > 0 && !selectedCategory && (
              <>
                <Text style={styles.sectionLabel}>Featured</Text>
                {featured.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    adopting={adopting === t.id}
                    onAdopt={() => handleAdopt(t)}
                    onPress={() => router.push(`/protocol-template/${t.id}` as any)}
                  />
                ))}
              </>
            )}

            {/* All templates */}
            {rest.length > 0 && (
              <>
                {featured.length > 0 && !selectedCategory && (
                  <Text style={styles.sectionLabel}>All Templates</Text>
                )}
                {rest.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    adopting={adopting === t.id}
                    onAdopt={() => handleAdopt(t)}
                    onPress={() => router.push(`/protocol-template/${t.id}` as any)}
                  />
                ))}
              </>
            )}

            {/* If only featured and it's a category filter */}
            {rest.length === 0 && selectedCategory && featured.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                adopting={adopting === t.id}
                onAdopt={() => handleAdopt(t)}
                onPress={() => router.push(`/protocol-template/${t.id}` as any)}
              />
            ))}
          </>
        )}
      </FadeInView>
    </ScrollView>
  );
}

function TemplateCard({
  template,
  adopting,
  onAdopt,
  onPress,
}: {
  template: ProtocolTemplateListItem;
  adopting: boolean;
  onAdopt: () => void;
  onPress: () => void;
}) {
  const iconName = template.icon || CATEGORY_ICONS[template.category] || "cube";
  const difficultyColor = DIFFICULTY_COLORS[template.difficulty ?? ""] ?? colors.textMuted;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${template.name} template`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <FontAwesome name={iconName as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={styles.cardTitle} numberOfLines={1}>{template.name}</Text>
          <View style={styles.cardMeta}>
            {template.difficulty && (
              <View style={[styles.badge, { backgroundColor: difficultyColor + "18" }]}>
                <Text style={[styles.badgeText, { color: difficultyColor }]}>
                  {template.difficulty}
                </Text>
              </View>
            )}
            <Text style={styles.itemsCount}>
              {template.items_count} item{template.items_count !== 1 ? "s" : ""}
            </Text>
            {template.adoption_count > 0 && (
              <Text style={styles.adoptionCount}>
                {template.adoption_count} adopted
              </Text>
            )}
          </View>
        </View>
      </View>

      {template.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {template.description}
        </Text>
      )}

      {template.tags && template.tags.length > 0 && (
        <View style={styles.tagRow}>
          {template.tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.adoptButton,
          adopting && styles.adoptButtonDisabled,
          pressed && !adopting && styles.adoptButtonPressed,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onAdopt();
        }}
        disabled={adopting}
        accessibilityRole="button"
        accessibilityLabel={`Adopt ${template.name}`}
      >
        {adopting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <FontAwesome name="plus" size={12} color={colors.white} />
            <Text style={styles.adoptButtonText}>Adopt</Text>
          </>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 28, position: "relative" },
  backdrop: { top: -48, height: 900 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  chipScroll: { marginBottom: 12 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleArea: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  itemsCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  adoptionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.accentLight,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent,
  },
  adoptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 10,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 2,
  },
  adoptButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  adoptButtonDisabled: {
    opacity: 0.6,
  },
  adoptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
