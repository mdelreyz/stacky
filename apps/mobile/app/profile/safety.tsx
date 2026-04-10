import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { preferences as prefsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { InteractionCheckResponse } from "@/lib/api";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  critical: { color: colors.dangerDark, bg: colors.safetyCriticalBg, icon: "exclamation-triangle" },
  major: { color: colors.warning, bg: colors.warningLight, icon: "exclamation-circle" },
  moderate: { color: colors.safetyModerateText, bg: colors.safetyModerateBg, icon: "info-circle" },
  minor: { color: colors.textMuted, bg: colors.surface, icon: "info" },
};

export default function SafetyCheckScreen() {
  const [result, setResult] = useState<InteractionCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const response = await prefsApi.checkInteractions();
      setResult(response);
      setChecked(true);
    } catch (error: any) {
      showError(error.message || "Failed to check interactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="Safety Check"
        subtitle="Scan your active stack for known interactions"
      />

      <View style={styles.card}>
        <Text style={styles.cardBody}>
          This checks all your active supplements, medications, and peptides for
          known interactions — contraindications, timing conflicts, and caution pairs.
        </Text>
        <Pressable
          style={[styles.checkButton, loading && styles.buttonDisabled]}
          onPress={handleCheck}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <FontAwesome name="shield" size={16} color={colors.white} />
              <Text style={styles.checkButtonText}>
                {checked ? "Re-check Interactions" : "Run Safety Check"}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {checked && result && (
        <>
          {/* Summary banner */}
          {result.total_warnings === 0 ? (
            <View style={styles.successBanner}>
              <FontAwesome name="check-circle" size={24} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>All Clear</Text>
                <Text style={styles.successBody}>
                  No known interactions detected in your current stack.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.summaryBanner}>
              <FontAwesome
                name="exclamation-triangle"
                size={20}
                color={result.has_critical ? colors.dangerDark : colors.warning}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>
                  {result.total_warnings} Interaction{result.total_warnings !== 1 ? "s" : ""} Found
                </Text>
                <Text style={styles.summaryBody}>
                  {[
                    result.has_critical && "Critical interactions detected",
                    result.has_major && "Major interactions detected",
                  ]
                    .filter(Boolean)
                    .join(". ") ||
                    "Moderate or minor interactions detected"}
                </Text>
              </View>
            </View>
          )}

          {/* Warnings list */}
          {result.warnings.map((warning, i) => {
            const config = SEVERITY_CONFIG[warning.severity] ?? SEVERITY_CONFIG.minor;
            return (
              <View key={i} style={[styles.warningCard, { borderLeftColor: config.color }]}>
                <View style={styles.warningHeader}>
                  <FontAwesome name={config.icon as any} size={14} color={config.color} />
                  <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.severityText, { color: config.color }]}>
                      {warning.severity}
                    </Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>
                      {warning.interaction_type === "contraindication" ? "Contraindication" : "Caution"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.warningPair}>
                  {warning.item_a} + {warning.item_b}
                </Text>
                <Text style={styles.warningDesc}>{warning.description}</Text>
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: { opacity: 0.6 },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.successLight,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  successBody: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.warningLight,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.warning,
  },
  summaryBody: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  warningCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  warningPair: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
