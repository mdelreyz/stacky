import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { peptides as peptidesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import { readProfileString, readProfileStringArray } from "@/lib/ai-profile";
import type { Peptide } from "@/lib/api";

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
  const aiDosage = readProfileString(ai, "typical_dosage");
  const aiRoute = readProfileString(ai, "recommended_route");
  const aiCycling = readProfileString(ai, "cycling_protocol");
  const aiStorage = readProfileString(ai, "storage");
  const aiReconstitution = readProfileString(ai, "reconstitution");
  const aiNotes = readProfileString(ai, "notes");
  const aiInteractions = readProfileStringArray(ai, "interactions");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title={peptide.name} subtitle={snakeCaseToLabel(peptide.category)} />

        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{snakeCaseToLabel(peptide.category)}</Text>
          </View>
          {ai && (
            <View style={[styles.categoryBadge, styles.infoBadge]}>
              <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
              <Text style={styles.infoBadgeText}>Profile</Text>
            </View>
          )}
          {peptide.form && (
            <View style={[styles.categoryBadge, styles.formBadge]}>
              <Text style={styles.formBadgeText}>{peptide.form}</Text>
            </View>
          )}
        </View>

        {peptide.description && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Overview</Text>
              <Text style={styles.sectionTitle}>What It Supports</Text>
              <Text style={styles.description}>{peptide.description}</Text>
            </View>
          </View>
        )}

        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Targets</Text>
              <Text style={styles.sectionTitle}>Goals</Text>
              <View style={styles.tagRow}>
                {goals.map((goal) => (
                  <View key={goal} style={styles.goalTag}>
                    <Text style={styles.goalTagText}>{goal.replace(/_/g, " ")}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {mechanismTags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Mechanism</Text>
              <Text style={styles.sectionTitle}>Mechanisms</Text>
              <View style={styles.tagRow}>
                {mechanismTags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {(aiDosage || aiRoute || aiCycling || aiReconstitution || aiStorage) && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Protocol</Text>
              <Text style={styles.sectionTitle}>Protocol Details</Text>
              <View style={styles.detailsGrid}>
                {aiDosage && (
                  <View style={styles.detailItem}>
                    <FontAwesome name="eyedropper" size={14} color={colors.primaryDark} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Typical Dosage</Text>
                      <Text style={styles.detailValue}>{aiDosage}</Text>
                    </View>
                  </View>
                )}
                {aiRoute && (
                  <View style={styles.detailItem}>
                    <FontAwesome name="crosshairs" size={14} color={colors.primaryDark} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Route</Text>
                      <Text style={styles.detailValue}>{aiRoute}</Text>
                    </View>
                  </View>
                )}
                {aiReconstitution && (
                  <View style={styles.detailItem}>
                    <FontAwesome name="flask" size={14} color={colors.primaryDark} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Reconstitution</Text>
                      <Text style={styles.detailValue}>{aiReconstitution}</Text>
                    </View>
                  </View>
                )}
                {aiStorage && (
                  <View style={styles.detailItem}>
                    <FontAwesome name="snowflake-o" size={14} color={colors.primaryDark} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Storage</Text>
                      <Text style={styles.detailValue}>{aiStorage}</Text>
                    </View>
                  </View>
                )}
                {aiCycling && (
                  <View style={styles.detailItem}>
                    <FontAwesome name="refresh" size={14} color={colors.primaryDark} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Cycling Protocol</Text>
                      <Text style={styles.detailValue}>{aiCycling}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {aiNotes && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Notes</Text>
              <Text style={styles.sectionTitle}>Guidance</Text>
              <View style={styles.notesBox}>
                <FontAwesome name="info-circle" size={14} color={colors.primaryDark} style={{ marginTop: 2 }} />
                <Text style={styles.notesText}>{aiNotes}</Text>
              </View>
            </View>
          </View>
        )}

        {aiInteractions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Safety</Text>
              <Text style={styles.sectionTitle}>Interactions</Text>
              <View style={styles.detailsGrid}>
                {aiInteractions.map((interaction, i) => (
                  <View key={i} style={styles.interactionRow}>
                    <FontAwesome name="exclamation-triangle" size={12} color={colors.warning} />
                    <Text style={styles.interactionText}>{interaction}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Link href={`/peptide/${peptide.id}/schedule`} asChild>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Add to My Protocol"
            >
              <FontAwesome name="plus" size={16} color={colors.white} />
              <Text style={styles.primaryButtonText}>Add to My Protocol</Text>
            </Pressable>
          </Link>
        </View>
      </FadeInView>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1340 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { paddingHorizontal: 16, marginTop: 16 },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 2,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236,246,240,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(95,156,120,0.14)",
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    textTransform: "capitalize",
  },
  infoBadge: { gap: 6, backgroundColor: "rgba(236,245,252,0.92)", borderColor: "rgba(104,138,160,0.14)" },
  infoBadgeText: { fontSize: 12, fontWeight: "700", color: colors.primaryDark },
  formBadge: { backgroundColor: "rgba(255,244,230,0.92)", borderColor: "rgba(241,181,104,0.18)" },
  formBadgeText: { fontSize: 12, fontWeight: "700", color: colors.warningDark },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  card: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.grayDark,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalTag: {
    backgroundColor: "rgba(236,246,240,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(95,156,120,0.14)",
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    textTransform: "capitalize",
  },
  tag: {
    backgroundColor: "rgba(236,245,252,0.94)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(104,138,160,0.18)",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDarker,
  },
  detailsGrid: {
    gap: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
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
    backgroundColor: "rgba(236,245,252,0.94)",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(104,138,160,0.18)",
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.primaryDarker,
  },
  interactionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,248,235,0.86)",
    borderWidth: 1,
    borderColor: "rgba(241,181,104,0.12)",
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
    backgroundColor: colors.primaryDark,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
