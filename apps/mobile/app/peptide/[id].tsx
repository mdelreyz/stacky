import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, type Href } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { CatalogDetailScaffold } from "@/components/catalog-detail/CatalogDetailScaffold";
import { catalogDetailStyles as baseStyles } from "@/components/catalog-detail/catalogDetailStyles";
import { colors } from "@/constants/Colors";
import { peptides as peptidesApi } from "@/lib/api";
import { snakeCaseToLabel } from "@/lib/format";
import { readProfileString, readProfileStringArray } from "@/lib/ai-profile";
import { useCatalogItemDetail } from "@/lib/useCatalogItemDetail";
import type { Peptide } from "@/lib/api";

export default function PeptideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item: peptide, loading } = useCatalogItemDetail<Peptide>({
    id,
    fetchItem: peptidesApi.get,
    errorMessage: "Failed to load peptide",
  });

  const ai = (peptide?.ai_profile as Record<string, unknown> | null) ?? null;
  const goals = peptide?.goals ?? [];
  const mechanismTags = peptide?.mechanism_tags ?? [];
  const aiDosage = readProfileString(ai, "typical_dosage");
  const aiRoute = readProfileString(ai, "recommended_route");
  const aiCycling = readProfileString(ai, "cycling_protocol");
  const aiStorage = readProfileString(ai, "storage");
  const aiReconstitution = readProfileString(ai, "reconstitution");
  const aiNotes = readProfileString(ai, "notes");
  const aiInteractions = readProfileStringArray(ai, "interactions");

  return (
    <CatalogDetailScaffold
      loading={loading}
      missing={!peptide}
      missingMessage="Peptide not found"
      title={peptide?.name}
      subtitle={peptide ? snakeCaseToLabel(peptide.category) : undefined}
      backdropHeight={1340}
      action={
        peptide
          ? ({
              href: `/peptide/${peptide.id}/schedule`,
              label: "Add to My Protocol",
              accessibilityLabel: "Add to My Protocol",
              icon: "plus",
            } satisfies { href: Href; label: string; accessibilityLabel: string; icon: "plus" })
          : undefined
      }
    >
      {peptide ? (
        <>
          <View style={baseStyles.badgeRow}>
            <View style={[baseStyles.chip, baseStyles.chipSuccess]}>
              <Text style={baseStyles.chipSuccessText}>{snakeCaseToLabel(peptide.category)}</Text>
            </View>
            {ai ? (
              <View style={[baseStyles.chip, baseStyles.chipInfo]}>
                <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
                <Text style={baseStyles.chipInfoText}>Profile</Text>
              </View>
            ) : null}
            {peptide.form ? (
              <View style={[baseStyles.chip, baseStyles.chipWarm]}>
                <Text style={baseStyles.chipWarmText}>{peptide.form}</Text>
              </View>
            ) : null}
          </View>

          {peptide.description ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Overview</Text>
                <Text style={baseStyles.sectionTitle}>What It Supports</Text>
                <Text style={baseStyles.bodyText}>{peptide.description}</Text>
              </View>
            </View>
          ) : null}

          {goals.length > 0 ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Targets</Text>
                <Text style={baseStyles.sectionTitle}>Goals</Text>
                <View style={baseStyles.tagRow}>
                  {goals.map((goal) => (
                    <View key={goal} style={styles.goalTag}>
                      <Text style={styles.goalTagText}>{goal.replace(/_/g, " ")}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {mechanismTags.length > 0 ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Mechanism</Text>
                <Text style={baseStyles.sectionTitle}>Mechanisms</Text>
                <View style={baseStyles.tagRow}>
                  {mechanismTags.map((tag) => (
                    <View key={tag} style={baseStyles.tag}>
                      <Text style={baseStyles.tagText}>{tag.replace(/_/g, " ")}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {(aiDosage || aiRoute || aiCycling || aiReconstitution || aiStorage) ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Protocol</Text>
                <Text style={baseStyles.sectionTitle}>Protocol Details</Text>
                <View style={baseStyles.detailStack}>
                  {aiDosage ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="eyedropper" size={14} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Typical Dosage</Text>
                        <Text style={baseStyles.detailValue}>{aiDosage}</Text>
                      </View>
                    </View>
                  ) : null}
                  {aiRoute ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="crosshairs" size={14} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Route</Text>
                        <Text style={baseStyles.detailValue}>{aiRoute}</Text>
                      </View>
                    </View>
                  ) : null}
                  {aiReconstitution ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="flask" size={14} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Reconstitution</Text>
                        <Text style={baseStyles.detailValue}>{aiReconstitution}</Text>
                      </View>
                    </View>
                  ) : null}
                  {aiStorage ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="snowflake-o" size={14} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Storage</Text>
                        <Text style={baseStyles.detailValue}>{aiStorage}</Text>
                      </View>
                    </View>
                  ) : null}
                  {aiCycling ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="refresh" size={14} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Cycling Protocol</Text>
                        <Text style={baseStyles.detailValue}>{aiCycling}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {aiNotes ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Notes</Text>
                <Text style={baseStyles.sectionTitle}>Guidance</Text>
                <View style={baseStyles.noteBox}>
                  <FontAwesome name="info-circle" size={14} color={colors.primaryDark} style={{ marginTop: 2 }} />
                  <Text style={baseStyles.noteText}>{aiNotes}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {aiInteractions.length > 0 ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Safety</Text>
                <Text style={baseStyles.sectionTitle}>Interactions</Text>
                <View style={baseStyles.detailStack}>
                  {aiInteractions.map((interaction, i) => (
                    <View key={`${interaction}-${i}`} style={styles.interactionRow}>
                      <FontAwesome name="exclamation-triangle" size={12} color={colors.warning} />
                      <Text style={styles.interactionText}>{interaction}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </CatalogDetailScaffold>
  );
}

const styles = StyleSheet.create({
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
});
