import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import type { InteractionWarning } from "@/lib/api";

export function InteractionWarningsCard({
  warnings,
}: {
  warnings: InteractionWarning[];
}) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <View style={styles.warningCard}>
      <View style={styles.warningHeader}>
        <FontAwesome name="exclamation-triangle" size={16} color="#c92a2a" />
        <Text style={styles.warningTitle}>Interaction Warnings</Text>
      </View>
      {warnings.map((warning, index) => (
        <View
          key={`${warning.item_a}-${warning.item_b}-${index}`}
          style={styles.warningRow}
        >
          <Text style={styles.warningPair}>
            {warning.item_a} + {warning.item_b}
          </Text>
          <Text style={styles.warningText}>{warning.description}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    backgroundColor: "#fff5f5",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffe3e3",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#c92a2a",
  },
  warningRow: {
    marginTop: 8,
  },
  warningPair: {
    fontSize: 14,
    fontWeight: "600",
    color: "#862e2e",
  },
  warningText: {
    fontSize: 13,
    color: "#a61e4d",
    marginTop: 2,
    lineHeight: 18,
  },
});
