import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { medications as medicationsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
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
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    medicationsApi
      .get(id)
      .then((nextMedication) => {
        if (!cancelled) {
          setMedication(nextMedication);
        }
      })
      .catch(() => showError("Failed to load medication"))
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!medication) {
    return (
      <View style={styles.centered}>
        <Text>Medication not found</Text>
      </View>
    );
  }

  const aiProfile = medication.ai_profile;
  const commonNames = readCommonNames(aiProfile);
  const typicalDosages = readTypicalDosages(aiProfile);
  const interactions = readKnownInteractions(aiProfile);

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title={medication.name} subtitle={`${medication.category} · ${medication.form ?? "standard form"}`} />

      {medication.description ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.bodyText}>{medication.description}</Text>
        </View>
      ) : null}

      {commonNames.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Common Names</Text>
          <View style={styles.tagRow}>
            {commonNames.map((name) => (
              <View key={name} style={styles.tag}>
                <Text style={styles.tagText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {typicalDosages.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Typical Dosing</Text>
          {typicalDosages.map((dose) => (
            <Text key={dose} style={styles.bodyText}>
              {`\u2022 ${dose}`}
            </Text>
          ))}
        </View>
      ) : null}

      {interactions.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Known Interactions</Text>
          {interactions.map((interaction, index) => (
            <View key={`${interaction.substance}-${index}`} style={styles.interactionRow}>
              <Text style={styles.interactionSubstance}>{interaction.substance.replace(/_/g, " ")}</Text>
              <Text style={styles.bodyText}>{interaction.description}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {aiProfile?.monitoring_notes ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Monitoring</Text>
          <Text style={styles.bodyText}>{aiProfile.monitoring_notes}</Text>
        </View>
      ) : null}

      {aiProfile?.safety_notes ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Safety Notes</Text>
          <Text style={styles.bodyText}>{aiProfile.safety_notes}</Text>
        </View>
      ) : null}

      <Link href={`/medication/${medication.id}/schedule`} asChild>
        <Pressable style={styles.primaryButton} accessibilityRole="button" accessibilityLabel="Add to My Protocol">
          <FontAwesome name="plus" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Add Medication</Text>
        </Pressable>
      </Link>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDarker,
  },
  interactionRow: {
    marginTop: 8,
  },
  interactionSubstance: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.dangerDark,
    marginBottom: 2,
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
