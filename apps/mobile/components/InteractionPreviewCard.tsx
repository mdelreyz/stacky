import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";
import { preferences as preferencesApi } from "@/lib/api";
import type { InteractionCheckResponse, RecommendationItemType } from "@/lib/api";

const SEVERITY_CONFIG: Record<
  "critical" | "major" | "moderate" | "minor",
  { color: string; bg: string; label: string }
> = {
  critical: { color: colors.dangerDark, bg: colors.safetyCriticalBg, label: "Critical" },
  major: { color: colors.warning, bg: colors.warningLight, label: "Major" },
  moderate: { color: colors.safetyModerateText, bg: colors.safetyModerateBg, label: "Moderate" },
  minor: { color: colors.textMuted, bg: colors.surface, label: "Minor" },
};

export function InteractionPreviewCard({
  catalogId,
  itemType,
}: {
  catalogId: string;
  itemType: RecommendationItemType;
}) {
  const [result, setResult] = useState<InteractionCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    preferencesApi
      .previewInteractions([{ catalog_id: catalogId, item_type: itemType }])
      .then((nextResult) => {
        if (!cancelled) {
          setResult(nextResult);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogId, itemType]);

  if (loading) {
    return (
      <View style={[styles.card, styles.neutralCard]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.neutralTitle}>Checking current stack for conflicts…</Text>
      </View>
    );
  }

  if (!result) {
    return null;
  }

  if (result.total_warnings === 0) {
    return (
      <View style={[styles.card, styles.safeCard]}>
        <View style={styles.headerRow}>
          <FontAwesome name="check-circle" size={16} color={colors.success} />
          <Text style={styles.safeTitle}>No known conflicts with your current stack</Text>
        </View>
        <Text style={styles.safeBody}>
          This item did not trigger any known interaction warnings against your active regimen.
        </Text>
      </View>
    );
  }

  const topSeverity = result.warnings[0]?.severity ?? "minor";
  const topConfig = SEVERITY_CONFIG[topSeverity];
  const visibleWarnings = result.warnings.slice(0, 2);
  const hiddenCount = Math.max(0, result.total_warnings - visibleWarnings.length);

  return (
    <View style={[styles.card, styles.warningCard]}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <FontAwesome name="exclamation-triangle" size={16} color={topConfig.color} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.warningTitle}>Potential conflicts with your current stack</Text>
            <Text style={styles.warningSubtitle}>
              Review these before adding this item.
            </Text>
          </View>
        </View>
        <View style={[styles.summaryBadge, { backgroundColor: topConfig.bg }]}>
          <Text style={[styles.summaryBadgeText, { color: topConfig.color }]}>{topConfig.label}</Text>
        </View>
      </View>

      {visibleWarnings.map((warning, index) => {
        const config = SEVERITY_CONFIG[warning.severity];
        return (
          <View key={`${warning.item_a}-${warning.item_b}-${index}`} style={styles.warningRow}>
            <View style={styles.warningRowTop}>
              <Text style={styles.warningPair}>
                {warning.item_a} + {warning.item_b}
              </Text>
              <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
                <Text style={[styles.severityBadgeText, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>
            <Text style={styles.warningBody}>{warning.description}</Text>
          </View>
        );
      })}

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {hiddenCount > 0 ? `+${hiddenCount} more warning${hiddenCount === 1 ? "" : "s"} in Safety Check` : "Open Safety Check for the full interaction review"}
        </Text>
        <Link href="/profile/safety" asChild>
          <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}>
            <Text style={styles.linkText}>Safety Check</Text>
            <FontAwesome name="chevron-right" size={11} color={colors.primaryDark} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  neutralCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  safeCard: {
    backgroundColor: "rgba(234,245,239,0.88)",
    borderColor: "rgba(208,232,218,0.9)",
  },
  warningCard: {
    backgroundColor: "rgba(248,243,232,0.92)",
    borderColor: colors.warningBorder,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  neutralTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  safeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.success,
  },
  safeBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 8,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.warningBrownDark,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(226,212,176,0.72)",
  },
  warningRowTop: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  warningPair: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.warningBrownDark,
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
  warningBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(226,212,176,0.72)",
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    lineHeight: 17,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  linkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  linkPressed: {
    opacity: 0.88,
  },
});
