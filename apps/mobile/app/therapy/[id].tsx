import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { therapies as therapiesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import { readProfileNumber, readProfileString, readProfileStringArray } from "@/lib/ai-profile";
import type { Therapy } from "@/lib/api";

export default function TherapyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [therapy, setTherapy] = useState<Therapy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    therapiesApi
      .get(id)
      .then((t) => { if (!cancelled) setTherapy(t); })
      .catch(() => showError("Failed to load therapy"))
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

  if (!therapy) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.textSecondary }}>Therapy not found</Text>
      </View>
    );
  }

  const ai = therapy.ai_profile as Record<string, unknown> | null;
  const tags = readProfileStringArray(ai, "tags");
  const sessionTemplate = readProfileString(ai, "session_template");
  const defaultDuration = readProfileNumber(ai, "default_duration_minutes");
  const defaultFrequency = readProfileString(ai, "default_frequency");
  const defaultWindow = readProfileString(ai, "default_take_window");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title={therapy.name} subtitle={snakeCaseToLabel(therapy.category)} />

        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{snakeCaseToLabel(therapy.category)}</Text>
          </View>
          {ai && (
            <View style={[styles.categoryBadge, styles.infoBadge]}>
              <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
              <Text style={styles.infoBadgeText}>Profile</Text>
            </View>
          )}
        </View>

        {therapy.description && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Overview</Text>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <Text style={styles.description}>{therapy.description}</Text>
            </View>
          </View>
        )}

        {(defaultDuration || defaultFrequency || defaultWindow) && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Defaults</Text>
              <Text style={styles.sectionTitle}>Recommended Rhythm</Text>
              <View style={styles.defaultsGrid}>
                {defaultDuration != null && (
                  <View style={styles.defaultItem}>
                    <FontAwesome name="clock-o" size={16} color={colors.primaryDark} />
                    <View>
                      <Text style={styles.defaultLabel}>Duration</Text>
                      <Text style={styles.defaultValue}>{defaultDuration} min</Text>
                    </View>
                  </View>
                )}
                {defaultFrequency && (
                  <View style={styles.defaultItem}>
                    <FontAwesome name="repeat" size={14} color={colors.primaryDark} />
                    <View>
                      <Text style={styles.defaultLabel}>Frequency</Text>
                      <Text style={styles.defaultValue}>{snakeCaseToLabel(defaultFrequency)}</Text>
                    </View>
                  </View>
                )}
                {defaultWindow && (
                  <View style={styles.defaultItem}>
                    <FontAwesome name="sun-o" size={15} color={colors.primaryDark} />
                    <View>
                      <Text style={styles.defaultLabel}>Time Window</Text>
                      <Text style={styles.defaultValue}>{snakeCaseToLabel(defaultWindow)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {sessionTemplate && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Guidance</Text>
              <Text style={styles.sectionTitle}>Session Template</Text>
              <View style={styles.templateBox}>
                <FontAwesome name="list-ol" size={14} color={colors.primaryDark} style={{ marginTop: 2 }} />
                <Text style={styles.templateText}>{sessionTemplate}</Text>
              </View>
            </View>
          </View>
        )}

        {tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Labels</Text>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagRow}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Link href={`/therapy/${therapy.id}/schedule`} asChild>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Start Protocol"
            >
              <FontAwesome name="play" size={16} color={colors.white} />
              <Text style={styles.primaryButtonText}>Start Protocol</Text>
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
  backdrop: { top: -48, height: 1220 },
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
  defaultsGrid: {
    gap: 14,
  },
  defaultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  defaultLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  defaultValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginTop: 1,
  },
  templateBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(236,245,252,0.94)",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(104,138,160,0.18)",
  },
  templateText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.primaryDarker,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
