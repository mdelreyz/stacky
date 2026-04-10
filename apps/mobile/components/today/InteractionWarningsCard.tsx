import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
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
        <FontAwesome name="exclamation-triangle" size={16} color={colors.dangerDark} />
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
    backgroundColor: "rgba(248,237,237,0.9)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#efd3d3",
    shadowColor: colors.dangerDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
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
    color: colors.dangerDark,
  },
  warningRow: {
    marginTop: 8,
  },
  warningPair: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dangerDark,
  },
  warningText: {
    fontSize: 13,
    color: colors.danger,
    marginTop: 2,
    lineHeight: 18,
  },
});
