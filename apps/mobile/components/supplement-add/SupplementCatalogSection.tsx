import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import type { Supplement } from "@/lib/api";
import { aiBadgeLabel, formatSupplementCategory, sourceLabel } from "./config";
import { styles } from "./styles";

export function SupplementCatalogSection({
  activeCategory,
  browsePreview,
  catalogLoading,
  categories,
  onToggleCategory,
}: {
  activeCategory: string | null;
  browsePreview: Supplement[];
  catalogLoading: boolean;
  categories: string[];
  onToggleCategory: (category: string | null) => void;
}) {
  return (
    <>
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
            onPress={() => onToggleCategory(null)}
            accessibilityRole="button"
            accessibilityLabel="All categories"
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
              onPress={() => onToggleCategory(category)}
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
                  <Text style={styles.browseCategoryPillText}>{formatSupplementCategory(item.category)}</Text>
                </View>
              <Text style={styles.browseSourceText}>{sourceLabel(item)}</Text>
            </View>
            <Text style={styles.browseName}>{item.name}</Text>
            <Text style={styles.browseStatus}>{aiBadgeLabel(item)}</Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyGlassCard}>
          <Text style={styles.emptyTitle}>No supplements available to browse</Text>
        </View>
      )}
    </>
  );
}
