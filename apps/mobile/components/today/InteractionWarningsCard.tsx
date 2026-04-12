import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";
import type { InteractionWarning } from "@/lib/api";

const SEVERITY_CONFIG: Record<
  InteractionWarning["severity"],
  { color: string; bg: string; icon: string; label: string }
> = {
  critical: {
    color: colors.dangerDark,
    bg: colors.safetyCriticalBg,
    icon: "exclamation-triangle",
    label: "Critical",
  },
  major: {
    color: colors.warning,
    bg: colors.warningLight,
    icon: "exclamation-circle",
    label: "Major",
  },
  moderate: {
    color: colors.safetyModerateText,
    bg: colors.safetyModerateBg,
    icon: "info-circle",
    label: "Moderate",
  },
  minor: {
    color: colors.textMuted,
    bg: colors.surface,
    icon: "info",
    label: "Minor",
  },
};

export function InteractionWarningsCard({
  warnings,
}: {
  warnings: InteractionWarning[];
}) {
  if (warnings.length === 0) {
    return null;
  }

  const topSeverity = warnings[0]?.severity ?? "minor";
  const topConfig = SEVERITY_CONFIG[topSeverity];
  const visibleWarnings = warnings.slice(0, 3);
  const hiddenCount = Math.max(0, warnings.length - visibleWarnings.length);

  return (
    <Link href="/profile/safety" asChild>
      <Pressable style={({ pressed }) => [styles.warningCard, pressed && styles.warningCardPressed]}>
        <View style={styles.warningHeader}>
          <View style={styles.warningHeaderCopy}>
            <FontAwesome name={topConfig.icon as any} size={16} color={topConfig.color} />
            <View style={styles.warningTitleWrap}>
              <Text style={styles.warningTitle}>Interaction Warnings</Text>
              <Text style={styles.warningSubtitle}>
                {warnings.length} pair{warnings.length === 1 ? "" : "s"} detected. Tap for full safety check.
              </Text>
            </View>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: topConfig.bg }]}>
            <Text style={[styles.summaryBadgeText, { color: topConfig.color }]}>
              {topConfig.label}
            </Text>
          </View>
        </View>

        {visibleWarnings.map((warning, index) => {
          const config = SEVERITY_CONFIG[warning.severity];
          return (
            <View key={`${warning.item_a}-${warning.item_b}-${index}`} style={styles.warningRow}>
              <View style={styles.warningRowHeader}>
                <Text style={styles.warningPair}>
                  {warning.item_a} + {warning.item_b}
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.severityBadgeText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.warningText} numberOfLines={2}>
                {warning.description}
              </Text>
              <Text style={styles.warningMeta}>
                {warning.type === "contraindication" ? "Contraindication" : "Caution"}
              </Text>
            </View>
          );
        })}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {hiddenCount > 0 ? `+${hiddenCount} more in Safety Check` : "Open Safety Check for full details"}
          </Text>
          <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
        </View>
      </Pressable>
    </Link>
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
  warningCardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.988 }],
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  warningHeaderCopy: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  warningTitleWrap: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dangerDark,
  },
  warningSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  summaryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  warningRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(239,211,211,0.8)",
  },
  warningRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  severityBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  warningPair: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dangerDark,
    flex: 1,
  },
  warningText: {
    fontSize: 13,
    color: colors.danger,
    marginTop: 2,
    lineHeight: 18,
  },
  warningMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(239,211,211,0.8)",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
