import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";
import { snakeCaseToLabel } from "@/lib/format";
import type { WizardRecommendedItem } from "@/lib/api";

type WizardResult = {
  items: WizardRecommendedItem[];
  protocolName: string | null;
  summary: string | null;
};

type WizardResultCardProps = {
  result: WizardResult;
  applying: boolean;
  onApply: () => void;
  onStartOver: () => void;
};

export function WizardResultCard({
  result,
  applying,
  onApply,
  onStartOver,
}: WizardResultCardProps) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>Recommended Protocol</Text>
      {result.protocolName && <Text style={styles.resultProtocolName}>{result.protocolName}</Text>}
      {result.summary && <Text style={styles.resultSummary}>{result.summary}</Text>}
      {result.items.map((item, index) => (
        <View key={item.catalog_id || `${item.name}-${index}`} style={styles.resultItem}>
          <Text style={styles.resultItemName}>{item.name}</Text>
          <View style={styles.resultItemMeta}>
            <Text style={styles.resultItemType}>{snakeCaseToLabel(item.item_type)}</Text>
            {item.suggested_dosage && (
              <Text style={styles.resultItemDosage}>{item.suggested_dosage}</Text>
            )}
            {item.suggested_window && (
              <Text style={styles.resultItemWindow}>
                {snakeCaseToLabel(item.suggested_window)}
              </Text>
            )}
          </View>
          <Text style={styles.resultItemReason}>{item.reason}</Text>
        </View>
      ))}

      <Pressable
        style={({ pressed }) => [
          styles.applyButton,
          applying && styles.buttonDisabled,
          pressed && !applying && styles.buttonPressed,
        ]}
        onPress={onApply}
        disabled={applying}
        accessibilityRole="button"
        accessibilityLabel="Add all to my protocol"
      >
        {applying ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name="check" size={16} color={colors.white} />
            <Text style={styles.applyButtonText}>Add All to My Protocol</Text>
          </>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.startOverButton, pressed && styles.softPressed]}
        onPress={onStartOver}
        accessibilityRole="button"
        accessibilityLabel="Start over"
      >
        <Text style={styles.startOverText}>Start Over</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultProtocolName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
    marginBottom: 4,
  },
  resultSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  resultItem: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(248,251,255,0.72)",
    marginTop: 10,
  },
  resultItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  resultItemMeta: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  resultItemType: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    backgroundColor: "rgba(243,247,251,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    textTransform: "capitalize",
  },
  resultItemDosage: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryDark,
    backgroundColor: "rgba(234,242,248,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resultItemWindow: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
    backgroundColor: "rgba(234,245,239,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    textTransform: "capitalize",
  },
  resultItemReason: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 16,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  startOverButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 16,
  },
  startOverText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  softPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
