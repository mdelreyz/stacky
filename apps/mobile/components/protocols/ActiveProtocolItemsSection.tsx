import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, type Href } from "expo-router";

import { colors } from "@/constants/Colors";
import { ProtocolsSectionHeader } from "./ProtocolsSectionHeader";

type IconName = ComponentProps<typeof FontAwesome>["name"];

export interface ActiveProtocolListItem {
  id: string;
  name: string;
  meta: string;
  detail?: string;
  href: Href;
}

export function ActiveProtocolItemsSection({
  title,
  actionHref,
  actionLabel,
  emptyIcon,
  emptyTitle,
  emptyHint,
  items,
}: {
  title: string;
  actionHref?: Href;
  actionLabel?: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyHint: string;
  items: ActiveProtocolListItem[];
}) {
  return (
    <>
      <ProtocolsSectionHeader title={`${title} (${items.length})`} actionHref={actionHref} actionLabel={actionLabel} />

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <FontAwesome name={emptyIcon} size={24} color={colors.primaryDark} />
          </View>
          <Text style={styles.emptyText}>{emptyTitle}</Text>
          <Text style={styles.emptyHint}>{emptyHint}</Text>
        </View>
      ) : (
        items.map((item) => (
          <Link key={item.id} href={item.href} asChild>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.meta}</Text>
                {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
              </View>
              <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
            </Pressable>
          </Link>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    marginBottom: 14,
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: colors.textSecondary },
  emptyHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.74)",
    marginHorizontal: 16,
    marginBottom: 10,
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
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.gray, marginTop: 5 },
  detail: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 17 },
});
