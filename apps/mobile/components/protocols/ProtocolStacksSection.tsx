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
          <View style={styles.emptyIconWrap}>
            <FontAwesome name="cubes" size={24} color={colors.primaryDark} />
          </View>
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
              <Pressable
                style={({ pressed }) => [styles.stackCard, pressed && styles.stackCardPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${stack.name}, ${stack.items.length} items`}
              >
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
  stackCard: {
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
  stackCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  stackInfo: { flex: 1, marginRight: 12 },
  stackName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  stackMeta: { fontSize: 12, color: colors.gray, marginTop: 5, lineHeight: 18 },
  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBadge,
  },
  statusBadgePaused: {
    backgroundColor: colors.dangerLight,
    borderColor: "#efd3d3",
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
  stackDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 7, lineHeight: 19 },
});
