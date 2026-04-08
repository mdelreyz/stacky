import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import type { CycleAlert } from "@/lib/api";

export function CycleAlertsCard({ alerts }: { alerts: CycleAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="refresh" size={16} color="#7048e8" />
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
    backgroundColor: "#f3f0ff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5dbff",
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
    color: "#6741d9",
  },
  row: {
    marginTop: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5f3dc4",
  },
  message: {
    fontSize: 13,
    color: "#495057",
    marginTop: 2,
    lineHeight: 18,
  },
});
