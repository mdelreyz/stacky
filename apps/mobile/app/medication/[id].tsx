import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, type Href } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { CatalogDetailScaffold } from "@/components/catalog-detail/CatalogDetailScaffold";
import { catalogDetailStyles as baseStyles } from "@/components/catalog-detail/catalogDetailStyles";
import { colors } from "@/constants/Colors";
import { medications as medicationsApi } from "@/lib/api";
import { useCatalogItemDetail } from "@/lib/useCatalogItemDetail";
import type { Medication, MedicationAIProfile } from "@/lib/api";

function readCommonNames(aiProfile: MedicationAIProfile | null): string[] {
  return Array.isArray(aiProfile?.common_names) ? aiProfile.common_names : [];
}

function readTypicalDosages(aiProfile: MedicationAIProfile | null): string[] {
  if (!Array.isArray(aiProfile?.typical_dosages)) {
    return [];
  }

  return aiProfile.typical_dosages.map((dose) =>
    `${dose.amount} ${dose.unit} · ${dose.frequency.replace(/_/g, " ")}`
  );
}

function readKnownInteractions(aiProfile: MedicationAIProfile | null) {
  return Array.isArray(aiProfile?.known_interactions) ? aiProfile.known_interactions : [];
}

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item: medication, loading } = useCatalogItemDetail<Medication>({
    id,
    fetchItem: medicationsApi.get,
    errorMessage: "Failed to load medication",
  });

  const aiProfile = medication?.ai_profile ?? null;
  const commonNames = readCommonNames(aiProfile);
  const typicalDosages = readTypicalDosages(aiProfile);
  const interactions = readKnownInteractions(aiProfile);

  return (
    <CatalogDetailScaffold
      loading={loading}
      missing={!medication}
      missingMessage="Medication not found"
      title={medication?.name}
      subtitle={medication ? `${medication.category} · ${medication.form ?? "standard form"}` : undefined}
      backdropHeight={1240}
      action={
        medication
          ? ({
              href: `/medication/${medication.id}/schedule`,
              label: "Add Medication",
              accessibilityLabel: "Add to My Protocol",
              icon: "plus",
            } satisfies { href: Href; label: string; accessibilityLabel: string; icon: "plus" })
          : undefined
      }
    >
      {medication ? (
        <>
          <View style={baseStyles.badgeRow}>
            <View style={baseStyles.chip}>
              <Text style={baseStyles.chipText}>{medication.category}</Text>
            </View>
            {medication.form ? (
              <View style={[baseStyles.chip, baseStyles.chipWarm]}>
                <Text style={baseStyles.chipWarmText}>{medication.form}</Text>
              </View>
            ) : null}
            {aiProfile ? (
              <View style={[baseStyles.chip, baseStyles.chipInfo]}>
                <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
                <Text style={baseStyles.chipInfoText}>AI Profile</Text>
              </View>
            ) : null}
          </View>

          {medication.description ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Overview</Text>
                <Text style={baseStyles.sectionTitle}>About This Medication</Text>
                <Text style={baseStyles.bodyText}>{medication.description}</Text>
              </View>
            </View>
          ) : null}

          {commonNames.length > 0 ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Aliases</Text>
                <Text style={baseStyles.sectionTitle}>Common Names</Text>
                <View style={baseStyles.tagRow}>
                  {commonNames.map((name) => (
                    <View key={name} style={baseStyles.tag}>
                      <Text style={baseStyles.tagText}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {typicalDosages.length > 0 ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Reference</Text>
                <Text style={baseStyles.sectionTitle}>Typical Dosing</Text>
                <View style={styles.listStack}>
                  {typicalDosages.map((dose) => (
                    <View key={dose} style={baseStyles.detailItem}>
                      <FontAwesome name="dot-circle-o" size={13} color={colors.primaryDark} />
                      <Text style={styles.listItemText}>{dose}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {interactions.length > 0 ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Caution</Text>
                <Text style={baseStyles.sectionTitle}>Known Interactions</Text>
                <View style={styles.listStack}>
                  {interactions.map((interaction, index) => (
                    <View key={`${interaction.substance}-${index}`} style={styles.interactionRow}>
                      <Text style={styles.interactionSubstance}>{interaction.substance.replace(/_/g, " ")}</Text>
                      <Text style={baseStyles.bodyText}>{interaction.description}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {aiProfile?.monitoring_notes ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Follow-Up</Text>
                <Text style={baseStyles.sectionTitle}>Monitoring</Text>
                <Text style={baseStyles.bodyText}>{aiProfile.monitoring_notes}</Text>
              </View>
            </View>
          ) : null}

          {aiProfile?.safety_notes ? (
            <View style={baseStyles.section}>
              <View style={[baseStyles.card, baseStyles.cardDanger]}>
                <Text style={baseStyles.sectionEyebrow}>Safety</Text>
                <Text style={baseStyles.sectionTitle}>Safety Notes</Text>
                <Text style={baseStyles.bodyText}>{aiProfile.safety_notes}</Text>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </CatalogDetailScaffold>
  );
}

const styles = StyleSheet.create({
  listStack: { gap: 10 },
  listItemText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  interactionRow: {
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,246,246,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  interactionSubstance: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dangerDark,
  },
});
