import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

export function ProtocolsSearchStateCard({
  deferredSearch,
  isSearching,
  searchMatchCount,
}: {
  deferredSearch: string;
  isSearching: boolean;
  searchMatchCount: number;
}) {
  if (!isSearching) {
    return null;
  }

  if (searchMatchCount > 0) {
    return (
      <View style={styles.searchSummaryCard}>
        <Text style={styles.searchSummaryEyebrow}>Global Search</Text>
        <Text style={styles.searchSummaryTitle}>
          {searchMatchCount} match{searchMatchCount === 1 ? "" : "es"} for "{deferredSearch}"
        </Text>
        <Text style={styles.searchSummaryHint}>
          Results are grouped across stacks, active items, catalogs, exercise, nutrition, and the protocol library.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.searchEmptyCard}>
      <View style={styles.searchEmptyIconWrap}>
        <FontAwesome name="search" size={20} color={colors.primaryDark} />
      </View>
      <Text style={styles.searchEmptyTitle}>No global matches for "{deferredSearch}"</Text>
      <Text style={styles.searchEmptyText}>
        Try a broader term or search for a compound, stack name, exercise, or plan label.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchSummaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(243,248,252,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  searchSummaryEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.primaryDark,
    marginBottom: 8,
  },
  searchSummaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  searchSummaryHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 19,
  },
  searchEmptyCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 22,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
  },
  searchEmptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    marginBottom: 12,
  },
  searchEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  searchEmptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
});
