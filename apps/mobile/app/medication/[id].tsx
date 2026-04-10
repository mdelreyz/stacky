import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title={medication.name} subtitle={`${medication.category} · ${medication.form ?? "standard form"}`} />

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{medication.category}</Text>
          </View>
          {medication.form ? (
            <View style={[styles.metaChip, styles.metaChipWarm]}>
              <Text style={styles.metaChipWarmText}>{medication.form}</Text>
            </View>
          ) : null}
          {aiProfile ? (
            <View style={[styles.metaChip, styles.metaChipInfo]}>
              <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
              <Text style={styles.metaChipInfoText}>AI Profile</Text>
            </View>
          ) : null}
        </View>

        {medication.description ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Overview</Text>
              <Text style={styles.sectionTitle}>About This Medication</Text>
              <Text style={styles.bodyText}>{medication.description}</Text>
            </View>
          </View>
        ) : null}

        {commonNames.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Aliases</Text>
              <Text style={styles.sectionTitle}>Common Names</Text>
              <View style={styles.tagRow}>
                {commonNames.map((name) => (
                  <View key={name} style={styles.tag}>
                    <Text style={styles.tagText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {typicalDosages.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Reference</Text>
              <Text style={styles.sectionTitle}>Typical Dosing</Text>
              <View style={styles.listStack}>
                {typicalDosages.map((dose) => (
                  <View key={dose} style={styles.listItem}>
                    <FontAwesome name="dot-circle-o" size={13} color={colors.primaryDark} />
                    <Text style={styles.listItemText}>{dose}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {interactions.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Caution</Text>
              <Text style={styles.sectionTitle}>Known Interactions</Text>
              <View style={styles.listStack}>
                {interactions.map((interaction, index) => (
                  <View key={`${interaction.substance}-${index}`} style={styles.interactionRow}>
                    <Text style={styles.interactionSubstance}>{interaction.substance.replace(/_/g, " ")}</Text>
                    <Text style={styles.bodyText}>{interaction.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {aiProfile?.monitoring_notes ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Follow-Up</Text>
              <Text style={styles.sectionTitle}>Monitoring</Text>
              <Text style={styles.bodyText}>{aiProfile.monitoring_notes}</Text>
            </View>
          </View>
        ) : null}

        {aiProfile?.safety_notes ? (
          <View style={styles.section}>
            <View style={[styles.card, styles.safetyCard]}>
              <Text style={styles.sectionEyebrow}>Safety</Text>
              <Text style={styles.sectionTitle}>Safety Notes</Text>
              <Text style={styles.bodyText}>{aiProfile.safety_notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Link href={`/medication/${medication.id}/schedule`} asChild>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Add to My Protocol"
            >
              <FontAwesome name="plus" size={16} color={colors.white} />
              <Text style={styles.primaryButtonText}>Add Medication</Text>
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
  backdrop: { top: -48, height: 1240 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { paddingHorizontal: 16, marginTop: 16 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 2,
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  metaChipText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  metaChipWarm: { backgroundColor: "rgba(255,244,230,0.9)", borderColor: "rgba(241,181,104,0.22)" },
  metaChipWarmText: { fontSize: 12, fontWeight: "700", color: colors.warningDark },
  metaChipInfo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(236,245,252,0.92)" },
  metaChipInfoText: { fontSize: 12, fontWeight: "700", color: colors.primaryDark },
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
  safetyCard: { backgroundColor: "rgba(255,246,246,0.86)", borderColor: "rgba(203,91,91,0.12)" },
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
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  listStack: { gap: 10 },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  listItemText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(236,245,252,0.94)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(104,138,160,0.18)",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDarker,
  },
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
