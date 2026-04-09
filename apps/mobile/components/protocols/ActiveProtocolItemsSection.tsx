import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";
import { ProtocolsSectionHeader } from "./ProtocolsSectionHeader";

type IconName = ComponentProps<typeof FontAwesome>["name"];

export interface ActiveProtocolListItem {
  id: string;
  name: string;
  meta: string;
  detail?: string;
  href: string;
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
  actionHref?: string;
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
          <FontAwesome name={emptyIcon} size={40} color={colors.border} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>{emptyTitle}</Text>
          <Text style={styles.emptyHint}>{emptyHint}</Text>
        </View>
      ) : (
        items.map((item) => (
          <Link key={item.id} href={item.href} asChild>
            <Pressable style={styles.card}>
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
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: { fontSize: 16, fontWeight: "500", color: colors.textMuted },
  emptyHint: {
    fontSize: 13,
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.gray, marginTop: 4 },
  detail: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
