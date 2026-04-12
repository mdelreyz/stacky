import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";

export function ProtocolsHeroCard({
  activeProtocolCount,
  stackCount,
  visibleCatalogCount,
}: {
  activeProtocolCount: number;
  stackCount: number;
  visibleCatalogCount: number;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />
      <View style={styles.heroOrbWarm} />
      <Text style={styles.eyebrow}>Protocol Control Surface</Text>
      <Text style={styles.title}>My Protocols</Text>
      <Text style={styles.subtitle}>
        Supplements, medications, modalities, peptides, and stacks in a calmer, more browseable system.
      </Text>
      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatValue}>{activeProtocolCount}</Text>
          <Text style={styles.heroStatLabel}>Active items</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatValue}>{stackCount}</Text>
          <Text style={styles.heroStatLabel}>Stacks</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatValue}>{visibleCatalogCount}</Text>
          <Text style={styles.heroStatLabel}>Visible catalog</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    margin: 16,
    marginTop: 12,
    padding: 20,
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
    backgroundColor: "rgba(255,255,255,0.11)",
    top: -50,
    right: -22,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -28,
    left: -16,
  },
  heroOrbWarm: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -18,
    right: 34,
  },
  eyebrow: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
    marginBottom: 10,
  },
  title: { fontSize: 30, fontWeight: "800", color: colors.textWhite },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.78)", marginTop: 8, lineHeight: 21, maxWidth: "92%" },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textWhite,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
