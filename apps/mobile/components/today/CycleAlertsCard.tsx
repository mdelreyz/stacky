import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { CycleAlert } from "@/lib/api";

export function CycleAlertsCard({ alerts }: { alerts: CycleAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="refresh" size={16} color={colors.accentIcon} />
        <Text style={styles.title}>Phase Alerts</Text>
      </View>
      {alerts.map((alert) => (
        <View key={`${alert.item_name}-${alert.message}`} style={styles.row}>
          <Text style={styles.itemName}>{alert.item_name}</Text>
          <Text style={styles.message}>{alert.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(240,238,248,0.84)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accentDark,
  },
  row: {
    marginTop: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
