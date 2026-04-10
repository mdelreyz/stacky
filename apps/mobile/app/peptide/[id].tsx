import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { peptides as peptidesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import type { Peptide } from "@/lib/api";

function readString(profile: Record<string, unknown> | null, key: string): string | null {
  const value = profile?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readStringArray(obj: Record<string, unknown> | null, key: string): string[] {
  const value = obj?.[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default function PeptideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [peptide, setPeptide] = useState<Peptide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    peptidesApi
      .get(id)
      .then((p) => { if (!cancelled) setPeptide(p); })
      .catch(() => showError("Failed to load peptide"))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!peptide) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.textSecondary }}>Peptide not found</Text>
      </View>
    );
  }

  const ai = peptide.ai_profile as Record<string, unknown> | null;
  const goals = peptide.goals ?? [];
  const mechanismTags = peptide.mechanism_tags ?? [];
  const aiDosage = readString(ai, "typical_dosage");
  const aiRoute = readString(ai, "recommended_route");
  const aiCycling = readString(ai, "cycling_protocol");
  const aiStorage = readString(ai, "storage");
  const aiReconstitution = readString(ai, "reconstitution");
  const aiNotes = readString(ai, "notes");
  const aiInteractions = readStringArray(ai, "interactions");

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title={peptide.name} subtitle={snakeCaseToLabel(peptide.category)} />

      {/* Badges */}
      <View style={styles.badgeRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{snakeCaseToLabel(peptide.category)}</Text>
        </View>
        {ai && (
          <View style={[styles.categoryBadge, styles.infoBadge]}>
            <FontAwesome name="bolt" size={10} color={colors.primary} />
            <Text style={styles.infoBadgeText}> Profile</Text>
          </View>
        )}
        {peptide.form && (
          <View style={[styles.categoryBadge, styles.formBadge]}>
            <Text style={styles.formBadgeText}>{peptide.form}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {peptide.description && (
        <Text style={styles.description}>{peptide.description}</Text>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.tagRow}>
            {goals.map((goal) => (
              <View key={goal} style={styles.goalTag}>
                <Text style={styles.goalTagText}>{goal.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mechanism tags */}
      {mechanismTags.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mechanisms</Text>
          <View style={styles.tagRow}>
            {mechanismTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* AI Profile details */}
      {(aiDosage || aiRoute || aiCycling || aiReconstitution || aiStorage) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Protocol Details</Text>
          <View style={styles.detailsGrid}>
            {aiDosage && (
              <View style={styles.detailItem}>
                <FontAwesome name="eyedropper" size={14} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Typical Dosage</Text>
                  <Text style={styles.detailValue}>{aiDosage}</Text>
                </View>
              </View>
            )}
            {aiRoute && (
              <View style={styles.detailItem}>
                <FontAwesome name="crosshairs" size={14} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Route</Text>
                  <Text style={styles.detailValue}>{aiRoute}</Text>
                </View>
              </View>
            )}
            {aiReconstitution && (
              <View style={styles.detailItem}>
                <FontAwesome name="flask" size={14} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reconstitution</Text>
                  <Text style={styles.detailValue}>{aiReconstitution}</Text>
                </View>
              </View>
            )}
            {aiStorage && (
              <View style={styles.detailItem}>
                <FontAwesome name="snowflake-o" size={14} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Storage</Text>
                  <Text style={styles.detailValue}>{aiStorage}</Text>
                </View>
              </View>
            )}
            {aiCycling && (
              <View style={styles.detailItem}>
                <FontAwesome name="refresh" size={14} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Cycling Protocol</Text>
                  <Text style={styles.detailValue}>{aiCycling}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* AI Notes */}
      {aiNotes && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesBox}>
            <FontAwesome name="info-circle" size={14} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.notesText}>{aiNotes}</Text>
          </View>
        </View>
      )}

      {/* Interactions */}
      {aiInteractions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Interactions</Text>
          {aiInteractions.map((interaction, i) => (
            <View key={i} style={styles.interactionRow}>
              <FontAwesome name="exclamation-triangle" size={12} color={colors.warning} />
              <Text style={styles.interactionText}>{interaction}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Start button */}
      <Link href={`/peptide/${peptide.id}/schedule`} asChild>
        <Pressable style={styles.primaryButton} accessibilityRole="button" accessibilityLabel="Add to My Protocol">
          <FontAwesome name="plus" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Add to My Protocol</Text>
        </Pressable>
      </Link>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successBadge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
    textTransform: "capitalize",
  },
  infoBadge: { backgroundColor: colors.primaryLight },
  infoBadgeText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  formBadge: { backgroundColor: colors.badgeYellow },
  formBadgeText: { fontSize: 12, fontWeight: "600", color: colors.warning },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.grayDark,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalTag: {
    backgroundColor: colors.successBadge,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
    textTransform: "capitalize",
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDarker,
  },
  detailsGrid: {
    gap: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 1,
    lineHeight: 21,
  },
  notesBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDarker,
  },
  interactionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  interactionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
