import { useState, type ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, type Href } from "expo-router";

import { colors } from "@/constants/Colors";
import { ProtocolsSectionHeader } from "./ProtocolsSectionHeader";

type IconName = ComponentProps<typeof FontAwesome>["name"];

export interface CatalogListItem {
  id: string;
  name: string;
  category: string;
  href: Href;
  iconName: IconName;
  badgeLabel?: string;
}

export function CatalogSection({
  title,
  items,
  emptyText,
  categoryFilter,
}: {
  title: string;
  items: CatalogListItem[];
  emptyText: string;
  categoryFilter?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = categoryFilter
    ? [...new Set(items.map((item) => item.category))].sort()
    : [];

  const filtered = activeCategory
    ? items.filter((item) => item.category === activeCategory)
    : items;

  return (
    <>
      <ProtocolsSectionHeader title={title} />
      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipContent}
        >
          <Pressable
            style={[styles.chip, !activeCategory && styles.chipActive]}
            onPress={() => setActiveCategory(null)}
            accessibilityRole="button"
            accessibilityLabel="All categories"
            accessibilityState={{ selected: !activeCategory }}
          >
            <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>All</Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
              accessibilityRole="button"
              accessibilityLabel={cat}
              accessibilityState={{ selected: activeCategory === cat }}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        filtered.map((item) => (
          <Link key={item.id} href={item.href} asChild>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <View style={styles.infoRow}>
                <View style={styles.iconWrap}>
                  <FontAwesome name={item.iconName} size={14} color={colors.primaryDark} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                </View>
              </View>
              {item.badgeLabel ? (
                <View
                  style={[
                    styles.badge,
                    item.badgeLabel === "User-Created" ? styles.badgeUserCreated : styles.badgeCatalog,
                  ]}
                >
                  <Text style={styles.badgeText}>{item.badgeLabel}</Text>
                </View>
              ) : null}
              <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
            </Pressable>
          </Link>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  chipContent: {
    gap: 6,
    paddingRight: 8,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.62)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: colors.primaryDarker,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.74)",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  infoRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  category: { fontSize: 12, color: colors.gray, marginTop: 4, textTransform: "capitalize" },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 10,
    borderWidth: 1,
  },
  badgeCatalog: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  badgeUserCreated: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningBorder,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
