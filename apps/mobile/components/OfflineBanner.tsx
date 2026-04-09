import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { useNetwork } from "@/contexts/NetworkContext";

export function OfflineBanner() {
  const { isOnline, pendingWrites } = useNetwork();

  if (isOnline && pendingWrites === 0) return null;

  if (!isOnline) {
    return (
      <View style={styles.offlineBanner}>
        <FontAwesome name="wifi" size={14} color={colors.white} />
        <Text style={styles.offlineText}>
          You're offline — showing cached data
          {pendingWrites > 0
            ? ` · ${pendingWrites} update${pendingWrites !== 1 ? "s" : ""} queued`
            : ""}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.syncBanner}>
      <FontAwesome name="refresh" size={12} color={colors.primaryDark} />
      <Text style={styles.syncText}>
        Syncing {pendingWrites} queued update{pendingWrites !== 1 ? "s" : ""}...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#495057",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  syncText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDark,
  },
});
