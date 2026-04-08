import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { supplements as supplementsApi } from "@/lib/api";
import type { Supplement } from "@/lib/api";

const POLL_INTERVAL_MS = 2500;

export default function SupplementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const loadSupplement = async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const nextSupplement = await supplementsApi.get(id);
        if (cancelled) return;
        setSupplement(nextSupplement);

        if (nextSupplement.ai_status === "generating" && !nextSupplement.ai_profile) {
          timeoutId = setTimeout(() => {
            void loadSupplement(true);
          }, POLL_INTERVAL_MS);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };

    void loadSupplement();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  if (!supplement) {
    return (
      <View style={styles.centered}>
        <Text>Supplement not found</Text>
      </View>
    );
  }

  const ai = supplement.ai_profile as Record<string, any> | null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color="#495057" />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {supplement.name}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{supplement.category}</Text>
        </View>
        {supplement.form && (
          <View style={[styles.categoryBadge, { backgroundColor: "#f1f3f5" }]}>
            <Text style={[styles.categoryText, { color: "#495057" }]}>
              {supplement.form}
            </Text>
          </View>
        )}
        {ai ? (
          <View style={[styles.categoryBadge, { backgroundColor: "#e7f5ff" }]}>
            <FontAwesome name="magic" size={10} color="#228be6" />
            <Text style={[styles.categoryText, { color: "#228be6" }]}>
              {" "}AI Profile
            </Text>
          </View>
        ) : supplement.ai_status === "generating" ? (
          <View style={[styles.categoryBadge, { backgroundColor: "#eef7ff" }]}>
            <ActivityIndicator size="small" color="#228be6" />
            <Text style={[styles.categoryText, { color: "#228be6" }]}>
              {" "}Generating
            </Text>
          </View>
        ) : supplement.ai_status === "failed" ? (
          <View style={[styles.categoryBadge, { backgroundColor: "#fff5f5" }]}>
            <FontAwesome name="warning" size={10} color="#e03131" />
            <Text style={[styles.categoryText, { color: "#e03131" }]}>
              {" "}Generation Failed
            </Text>
          </View>
        ) : null}
      </View>

      {supplement.description && (
        <Text style={styles.description}>{supplement.description}</Text>
      )}

      <Pressable
        style={styles.primaryAction}
        onPress={() => router.push(`/supplement/${supplement.id}/schedule`)}
      >
        <FontAwesome name="plus-circle" size={16} color="#fff" />
        <Text style={styles.primaryActionText}>Add to My Protocol</Text>
      </Pressable>

      {ai ? (
        <>
          {/* Mechanism */}
          <Section title="Mechanism of Action" icon="cogs">
            <Text style={styles.bodyText}>{ai.mechanism_of_action}</Text>
          </Section>

          {/* Dosage */}
          <Section title="Typical Dosages" icon="eyedropper">
            {(ai.typical_dosages || []).map((d: any, i: number) => (
              <View key={i} style={styles.dosageRow}>
                <Text style={styles.dosageAmount}>
                  {d.amount} {d.unit}
                </Text>
                <Text style={styles.dosageContext}>
                  {d.frequency.replace("_", " ")} — {d.context.replace(/_/g, " ")}
                </Text>
              </View>
            ))}
          </Section>

          {/* Timing */}
          <Section title="Timing Recommendations" icon="clock-o">
            <InfoRow
              label="Best windows"
              value={(ai.timing_recommendations?.preferred_windows || [])
                .map((w: string) => w.replace(/_/g, " "))
                .join(", ")}
            />
            <InfoRow
              label="With food"
              value={ai.timing_recommendations?.with_food ? "Yes" : "No"}
            />
            {ai.timing_recommendations?.food_interactions && (
              <Text style={styles.bodyTextSmall}>
                {ai.timing_recommendations.food_interactions}
              </Text>
            )}
          </Section>

          {/* Cycling */}
          {ai.cycling_recommendations && (
            <Section title="Cycling" icon="refresh">
              <InfoRow
                label="Cycling suggested"
                value={ai.cycling_recommendations.suggested ? "Yes" : "No"}
              />
              {ai.cycling_recommendations.typical_pattern && (
                <InfoRow
                  label="Pattern"
                  value={`${ai.cycling_recommendations.typical_pattern.on_weeks} weeks on / ${ai.cycling_recommendations.typical_pattern.off_weeks} weeks off`}
                />
              )}
              <Text style={styles.bodyTextSmall}>
                {ai.cycling_recommendations.rationale}
              </Text>
            </Section>
          )}

          {/* Interactions */}
          {(ai.known_interactions || []).length > 0 && (
            <Section title="Interactions" icon="exclamation-triangle">
              {ai.known_interactions.map((inter: any, i: number) => (
                <View key={i} style={styles.interactionRow}>
                  <View
                    style={[
                      styles.severityDot,
                      {
                        backgroundColor:
                          inter.severity === "critical"
                            ? "#e03131"
                            : inter.severity === "major"
                            ? "#fd7e14"
                            : inter.severity === "moderate"
                            ? "#fcc419"
                            : "#adb5bd",
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.interactionSubstance}>
                      {inter.substance.replace(/_/g, " ")}
                    </Text>
                    <Text style={styles.interactionDesc}>
                      {inter.description}
                    </Text>
                  </View>
                </View>
              ))}
            </Section>
          )}

          {/* Synergies */}
          {(ai.synergies || []).length > 0 && (
            <Section title="Synergies" icon="link">
              {ai.synergies.map((syn: any, i: number) => (
                <View key={i} style={styles.synergyRow}>
                  <Text style={styles.synergySubstance}>{syn.substance}</Text>
                  <Text style={styles.synergyBenefit}>{syn.benefit}</Text>
                  <Text style={styles.bodyTextSmall}>{syn.mechanism}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* Safety */}
          <Section title="Safety & Side Effects" icon="shield">
            {ai.safety_notes && (
              <Text style={styles.bodyText}>{ai.safety_notes}</Text>
            )}
            {(ai.side_effects || []).length > 0 && (
              <View style={styles.tagContainer}>
                {ai.side_effects.map((se: string, i: number) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {se.replace(/_/g, " ")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {(ai.contraindications || []).length > 0 && (
              <>
                <Text style={[styles.subLabel, { marginTop: 12 }]}>
                  Contraindications
                </Text>
                <View style={styles.tagContainer}>
                  {ai.contraindications.map((c: string, i: number) => (
                    <View key={i} style={[styles.tag, styles.tagDanger]}>
                      <Text style={styles.tagDangerText}>
                        {c.replace(/_/g, " ")}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Section>

          {/* Evidence */}
          <Section title="Evidence" icon="book">
            <InfoRow label="Quality" value={ai.evidence_quality || "—"} />
            {ai.sources_summary && (
              <Text style={styles.bodyTextSmall}>{ai.sources_summary}</Text>
            )}
          </Section>
        </>
      ) : supplement.ai_status === "failed" ? (
        <View style={styles.noProfile}>
          <FontAwesome name="warning" size={32} color="#e03131" />
          <Text style={styles.noProfileText}>AI profile generation failed</Text>
          <Text style={styles.noProfileHint}>
            {supplement.ai_error || "Retry onboarding once Claude access is configured."}
          </Text>
        </View>
      ) : (
        <View style={styles.noProfile}>
          <ActivityIndicator size="small" color="#228be6" />
          <Text style={styles.noProfileText}>
            Generating AI profile
          </Text>
          <Text style={styles.noProfileHint}>
            This page refreshes automatically when the profile is ready.
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
        <FontAwesome
          name={icon as any}
          size={15}
          color="#228be6"
          style={{ marginRight: 8 }}
        />
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
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
  },
  backButton: { padding: 8 },
  topTitle: { flex: 1, fontSize: 18, fontWeight: "600", color: "#212529", textAlign: "center" },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d3f9d8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: { fontSize: 12, fontWeight: "600", color: "#2b8a3e" },
  description: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#228be6",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#212529" },
  bodyText: { fontSize: 14, color: "#495057", lineHeight: 20 },
  bodyTextSmall: { fontSize: 13, color: "#868e96", lineHeight: 18, marginTop: 6 },
  subLabel: { fontSize: 13, fontWeight: "600", color: "#495057" },
  dosageRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
    gap: 8,
  },
  dosageAmount: { fontSize: 15, fontWeight: "600", color: "#228be6" },
  dosageContext: { fontSize: 13, color: "#868e96" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: "#868e96" },
  infoValue: { fontSize: 14, fontWeight: "500", color: "#212529" },
  interactionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  interactionSubstance: { fontSize: 14, fontWeight: "600", color: "#212529" },
  interactionDesc: { fontSize: 13, color: "#495057", lineHeight: 18 },
  synergyRow: { marginBottom: 10 },
  synergySubstance: { fontSize: 14, fontWeight: "600", color: "#2b8a3e" },
  synergyBenefit: { fontSize: 13, color: "#495057", marginTop: 2 },
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: "#f1f3f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 12, color: "#495057" },
  tagDanger: { backgroundColor: "#fff5f5" },
  tagDangerText: { fontSize: 12, color: "#e03131" },
  noProfile: {
    alignItems: "center",
    padding: 40,
  },
  noProfileText: { fontSize: 16, color: "#868e96", marginTop: 12 },
  noProfileHint: {
    fontSize: 13,
    color: "#868e96",
    marginTop: 8,
    lineHeight: 19,
    textAlign: "center",
  },
});
