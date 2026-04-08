import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { ProtocolsSectionHeader } from "./ProtocolsSectionHeader";

type IconName = ComponentProps<typeof FontAwesome>["name"];

export interface CatalogListItem {
  id: string;
  name: string;
  category: string;
  href: string;
  iconName: IconName;
  badgeLabel?: string;
}

export function CatalogSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: CatalogListItem[];
  emptyText: string;
}) {
  return (
    <>
      <ProtocolsSectionHeader title={title} />
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        items.map((item) => (
          <Link key={item.id} href={item.href} asChild>
            <Pressable style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.iconWrap}>
                  <FontAwesome name={item.iconName} size={14} color="#1c7ed6" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                </View>
              </View>
              {item.badgeLabel ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badgeLabel}</Text>
                </View>
              ) : null}
              <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
            </Pressable>
          </Link>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    padding: 18,
  },
  emptyText: {
    fontSize: 13,
    color: "#868e96",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  infoRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f5ff",
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#212529" },
  category: { fontSize: 12, color: "#6c757d", marginTop: 4 },
  badge: {
    backgroundColor: "#e7f5ff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1864ab",
  },
});
