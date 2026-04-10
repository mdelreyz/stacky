import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { SupplementAIProfile } from "@protocols/domain";

export function SupplementAIProfileContent({
  ai,
}: {
  ai: SupplementAIProfile;
}) {
  return (
    <>
      <Section title="Mechanism of Action" icon="cogs">
        <Text style={styles.bodyText}>{ai.mechanism_of_action}</Text>
      </Section>

      <Section title="Typical Dosages" icon="eyedropper">
        {ai.typical_dosages.map((dosage, index) => (
          <View key={`${dosage.amount}-${dosage.unit}-${index}`} style={styles.dosageRow}>
            <Text style={styles.dosageAmount}>
              {dosage.amount} {dosage.unit}
            </Text>
            <Text style={styles.dosageContext}>
              {dosage.frequency.replace(/_/g, " ")} — {dosage.context.replace(/_/g, " ")}
            </Text>
          </View>
        ))}
      </Section>

      <Section title="Timing Recommendations" icon="clock-o">
        <InfoRow
          label="Best windows"
          value={ai.timing_recommendations.preferred_windows
            .map((window) => window.replace(/_/g, " "))
            .join(", ")}
        />
        <InfoRow
          label="With food"
          value={ai.timing_recommendations.with_food ? "Yes" : "No"}
        />
        {ai.timing_recommendations.food_interactions ? (
          <Text style={styles.bodyTextSmall}>
            {ai.timing_recommendations.food_interactions}
          </Text>
        ) : null}
      </Section>

      {ai.cycling_recommendations ? (
        <Section title="Cycling" icon="refresh">
          <InfoRow
            label="Cycling suggested"
            value={ai.cycling_recommendations.suggested ? "Yes" : "No"}
          />
          {ai.cycling_recommendations.typical_pattern ? (
            <InfoRow
              label="Pattern"
              value={`${ai.cycling_recommendations.typical_pattern.on_weeks} weeks on / ${ai.cycling_recommendations.typical_pattern.off_weeks} weeks off`}
            />
          ) : null}
          <Text style={styles.bodyTextSmall}>{ai.cycling_recommendations.rationale}</Text>
        </Section>
      ) : null}

      {ai.known_interactions.length > 0 ? (
        <Section title="Interactions" icon="exclamation-triangle">
          {ai.known_interactions.map((interaction, index) => (
            <View
              key={`${interaction.substance}-${index}`}
              style={styles.interactionRow}
            >
              <View
                style={[
                  styles.severityDot,
                  { backgroundColor: severityColor(interaction.severity) },
                ]}
              />
              <View style={styles.flexContent}>
                <Text style={styles.interactionSubstance}>
                  {interaction.substance.replace(/_/g, " ")}
                </Text>
                <Text style={styles.interactionDesc}>{interaction.description}</Text>
              </View>
            </View>
          ))}
        </Section>
      ) : null}

      {ai.synergies.length > 0 ? (
        <Section title="Synergies" icon="link">
          {ai.synergies.map((synergy, index) => (
            <View key={`${synergy.substance}-${index}`} style={styles.synergyRow}>
              <Text style={styles.synergySubstance}>{synergy.substance}</Text>
              <Text style={styles.synergyBenefit}>{synergy.benefit}</Text>
              <Text style={styles.bodyTextSmall}>{synergy.mechanism}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title="Safety & Side Effects" icon="shield">
        {ai.safety_notes ? <Text style={styles.bodyText}>{ai.safety_notes}</Text> : null}
        {ai.side_effects.length > 0 ? (
          <View style={styles.tagContainer}>
            {ai.side_effects.map((sideEffect, index) => (
              <View key={`${sideEffect}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{sideEffect.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {ai.contraindications.length > 0 ? (
          <>
            <Text style={[styles.subLabel, styles.contraindicationsLabel]}>
              Contraindications
            </Text>
            <View style={styles.tagContainer}>
              {ai.contraindications.map((contraindication, index) => (
                <View
                  key={`${contraindication}-${index}`}
                  style={[styles.tag, styles.tagDanger]}
                >
                  <Text style={styles.tagDangerText}>
                    {contraindication.replace(/_/g, " ")}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </Section>

      <Section title="Evidence" icon="book">
        <InfoRow label="Quality" value={ai.evidence_quality || "—"} />
        {ai.sources_summary ? (
          <Text style={styles.bodyTextSmall}>{ai.sources_summary}</Text>
        ) : null}
      </Section>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <FontAwesome name={icon as never} size={15} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function severityColor(
  severity: "critical" | "major" | "moderate" | "minor"
): string {
  if (severity === "critical") return colors.danger;
  if (severity === "major") return colors.warning;
  if (severity === "moderate") return colors.warningAmber;
  return colors.textPlaceholder;
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bodyTextSmall: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 6,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  contraindicationsLabel: {
    marginTop: 12,
  },
  dosageRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
    gap: 8,
  },
  dosageAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  dosageContext: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    textAlign: "right",
  },
  interactionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  flexContent: {
    flex: 1,
  },
  interactionSubstance: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  interactionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  synergyRow: {
    marginBottom: 10,
  },
  synergySubstance: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
  },
  synergyBenefit: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagDanger: {
    backgroundColor: colors.dangerLight,
  },
  tagDangerText: {
    fontSize: 12,
    color: colors.danger,
  },
});
