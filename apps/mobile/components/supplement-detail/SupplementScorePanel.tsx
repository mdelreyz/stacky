import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";
import type { Supplement } from "@/lib/api";
import { buildSupplementScoreSummary, type SupplementScoreMetric, type SupplementStrengthScore } from "@/lib/supplement-score";

const DIAL_COLORS: Record<SupplementScoreMetric["key"], string> = {
  essential: colors.primaryDark,
  scientifically_supported: colors.success,
  used_by_experts: colors.warningAmber,
  longevity: colors.infoSecondary,
};

const STRENGTH_BADGE_COLORS: Record<SupplementStrengthScore["source"], { background: string; text: string }> = {
  goal: { background: "rgba(255,194,116,0.18)", text: colors.warningDark },
  mechanism: { background: "rgba(90,138,181,0.16)", text: colors.primaryDark },
  category: { background: "rgba(74,138,106,0.16)", text: colors.success },
};

const DIAL_TICK_COUNT = 18;
const DIAL_RADIUS = 34;
const DIAL_DOT = 5;
const DIAL_SIZE = 94;

export function SupplementScorePanel({ supplement }: { supplement: Supplement }) {
  const summary = buildSupplementScoreSummary(supplement);

  return (
    <View style={styles.card}>
      <View style={styles.heroGlowLarge} />
      <View style={styles.heroGlowWarm} />
      <Text style={styles.title}>Signal Panel</Text>
      <Text style={styles.subtitle}>
        Derived from evidence quality, safety depth, catalog goals, and mechanism signals.
      </Text>

      <View style={styles.metricGrid}>
        {summary.metrics.map((metric) => (
          <ScoreDial key={metric.key} metric={metric} />
        ))}
      </View>

      {summary.strengths.length > 0 ? (
        <View style={styles.strengthsSection}>
          <Text style={styles.strengthsTitle}>Top Performance Areas</Text>
          <View style={styles.strengthList}>
            {summary.strengths.map((strength) => (
              <StrengthRow key={`${strength.source}-${strength.label}`} strength={strength} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ScoreDial({ metric }: { metric: SupplementScoreMetric }) {
  const accent = DIAL_COLORS[metric.key];
  const activeTicks = Math.max(1, Math.round((metric.score / 100) * DIAL_TICK_COUNT));
  const center = DIAL_SIZE / 2;

  return (
    <View style={styles.metricCard}>
      <View style={styles.dialFrame}>
        <View style={[styles.dialShell, { borderColor: `${accent}2a` }]}>
          {Array.from({ length: DIAL_TICK_COUNT }).map((_, index) => {
            const angle = ((Math.PI * 2) / DIAL_TICK_COUNT) * index - Math.PI / 2;
            const x = center + Math.cos(angle) * DIAL_RADIUS - DIAL_DOT / 2;
            const y = center + Math.sin(angle) * DIAL_RADIUS - DIAL_DOT / 2;
            const active = index < activeTicks;

            return (
              <View
                key={`${metric.key}-${index}`}
                style={[
                  styles.dialTick,
                  {
                    left: x,
                    top: y,
                    backgroundColor: active ? accent : "rgba(184,196,208,0.55)",
                    opacity: active ? 0.95 : 0.7,
                  },
                ]}
              />
            );
          })}

          <View style={[styles.dialHalo, { backgroundColor: `${accent}18` }]} />
          <View style={styles.dialInner}>
            <Text style={[styles.scoreValue, { color: accent }]}>{metric.score}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
        </View>
      </View>

      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={styles.metricNote}>{metric.note}</Text>
    </View>
  );
}

function StrengthRow({ strength }: { strength: SupplementStrengthScore }) {
  const badgeColors = STRENGTH_BADGE_COLORS[strength.source];

  return (
    <View style={styles.strengthRow}>
      <View style={styles.strengthMeta}>
        <Text style={styles.strengthLabel}>{strength.label}</Text>
        <View style={[styles.strengthBadge, { backgroundColor: badgeColors.background }]}>
          <Text style={[styles.strengthBadgeText, { color: badgeColors.text }]}>
            {strength.source}
          </Text>
        </View>
      </View>
      <View style={styles.strengthBarTrack}>
        <View
          style={[
            styles.strengthBarFill,
            {
              width: `${strength.score}%`,
              backgroundColor: strength.score >= 80 ? colors.success : strength.score >= 65 ? colors.primary : colors.warningAmber,
            },
          ]}
        />
      </View>
      <Text style={styles.strengthScore}>{strength.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(123,220,225,0.12)",
    top: -46,
    right: -18,
  },
  heroGlowWarm: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.1)",
    bottom: -20,
    left: -12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    width: "48%",
    minWidth: 150,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(246,249,252,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  dialFrame: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dialShell: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.64)",
  },
  dialTick: {
    position: "absolute",
    width: DIAL_DOT,
    height: DIAL_DOT,
    borderRadius: 999,
  },
  dialHalo: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 999,
  },
  dialInner: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  scoreUnit: {
    marginTop: -1,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 18,
  },
  metricNote: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  strengthsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(216,224,232,0.55)",
  },
  strengthsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  strengthList: {
    marginTop: 12,
    gap: 10,
  },
  strengthRow: {
    gap: 7,
  },
  strengthMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  strengthLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  strengthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  strengthBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  strengthBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(230,236,242,0.9)",
    overflow: "hidden",
  },
  strengthBarFill: {
    height: 8,
    borderRadius: 999,
  },
  strengthScore: {
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
});
