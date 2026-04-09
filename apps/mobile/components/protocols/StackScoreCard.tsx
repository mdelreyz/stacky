import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";
import { preferences as prefsApi } from "@/lib/api";
import type { StackScoreResponse } from "@/lib/api";

function scoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return "#e67700";
  return colors.danger;
}

export function StackScoreCard() {
  const [score, setScore] = useState<StackScoreResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    prefsApi
      .getStackScore()
      .then((result) => {
        if (!cancelled) setScore(result);
      })
      .catch(() => {
        // No score available — user may not have items yet
      });

    return () => { cancelled = true; };
  }, []);

  if (!score || score.item_count === 0) return null;

  const totalColor = scoreColor(score.total_score);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Stack Score</Text>
          <Text style={styles.subtitle}>{score.item_count} items analyzed</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: totalColor + "18" }]}>
          <Text style={[styles.scoreText, { color: totalColor }]}>{score.total_score}</Text>
        </View>
      </View>

      <View style={styles.dimensionGrid}>
        {score.dimensions.map((dim) => (
          <View key={dim.name} style={styles.dimensionRow}>
            <Text style={styles.dimensionName}>{dim.name.replace(/_/g, " ")}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${dim.score}%`, backgroundColor: scoreColor(dim.score) },
                ]}
              />
            </View>
            <Text style={[styles.dimensionScore, { color: scoreColor(dim.score) }]}>
              {dim.score}
            </Text>
          </View>
        ))}
      </View>

      {score.synergies_found.length > 0 && (
        <View style={styles.synergiesSection}>
          <Text style={styles.synergiesTitle}>
            <FontAwesome name="bolt" size={12} color={colors.primary} /> {score.synergies_found.length} synergies detected
          </Text>
          {score.synergies_found.slice(0, 3).map((syn, i) => (
            <Text key={i} style={styles.synergyText}>
              {syn.item_a} + {syn.item_b}: {syn.benefit}
            </Text>
          ))}
        </View>
      )}

      {score.suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          {score.suggestions.slice(0, 2).map((suggestion, i) => (
            <View key={i} style={styles.suggestionRow}>
              <FontAwesome name="lightbulb-o" size={13} color="#e67700" />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 22,
    fontWeight: "800",
  },
  dimensionGrid: {
    gap: 10,
  },
  dimensionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dimensionName: {
    width: 100,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  dimensionScore: {
    width: 28,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  synergiesSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  synergiesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
    marginBottom: 6,
  },
  synergyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  suggestionsSection: {
    marginTop: 12,
    gap: 6,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
