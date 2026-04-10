import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";
import { ProtocolsSectionHeader } from "./ProtocolsSectionHeader";
import type { Protocol } from "@/lib/api";

export function ProtocolStacksSection({ stacks }: { stacks: Protocol[] }) {
  return (
    <>
      <ProtocolsSectionHeader title={`Stacks (${stacks.length})`} actionHref="/protocol/add" actionLabel="New Stack" />

      {stacks.length === 0 ? (
        <View style={styles.emptyCard}>
          <FontAwesome name="cubes" size={40} color={colors.border} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No stacks yet</Text>
          <Text style={styles.emptyHint}>
            Bundle active supplements and modalities into named routines like Morning Stack or Recovery Block.
          </Text>
        </View>
      ) : (
        stacks.map((stack) => {
          const names = stack.items
            .map(
              (item) =>
                item.user_supplement?.supplement.name ??
                item.user_medication?.medication.name ??
                item.user_therapy?.therapy.name
            )
            .filter((name): name is string => Boolean(name));

          return (
            <Link key={stack.id} href={`/protocol/${stack.id}`} asChild>
              <Pressable style={styles.stackCard} accessibilityRole="button" accessibilityLabel={`${stack.name}, ${stack.items.length} items`}>
                <View style={styles.stackInfo}>
                  <Text style={styles.stackName}>{stack.name}</Text>
                  <Text style={styles.stackMeta}>
                    {stack.items.length} items
                    {names.length > 0 ? ` · ${names.slice(0, 3).join(", ")}` : ""}
                  </Text>
                  <View style={styles.scheduleRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        stack.is_currently_active ? styles.statusBadgeActive : styles.statusBadgePaused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          stack.is_currently_active ? styles.statusBadgeTextActive : styles.statusBadgeTextPaused,
                        ]}
                      >
                        {stack.is_currently_active ? "Active now" : "Inactive now"}
                      </Text>
                    </View>
                    <Text style={styles.scheduleSummary}>{stack.schedule_summary}</Text>
                  </View>
                  {stack.description ? (
                    <Text style={styles.stackDescription}>{stack.description}</Text>
                  ) : null}
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
              </Pressable>
            </Link>
          );
        })
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
  stackCard: {
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
  stackInfo: { flex: 1, marginRight: 12 },
  stackName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  stackMeta: { fontSize: 12, color: colors.gray, marginTop: 4 },
  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeActive: {
    backgroundColor: colors.successLight,
  },
  statusBadgePaused: {
    backgroundColor: colors.dangerLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadgeTextActive: {
    color: colors.success,
  },
  statusBadgeTextPaused: {
    color: colors.dangerDark,
  },
  scheduleSummary: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  stackDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
});
