import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { therapies as therapiesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import type { Therapy } from "@/lib/api";

function readString(profile: Record<string, unknown> | null, key: string): string | null {
  const value = profile?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(profile: Record<string, unknown> | null, key: string): number | null {
  const value = profile?.[key];
  return typeof value === "number" ? value : null;
}

function readTags(profile: Record<string, unknown> | null): string[] {
  const tags = profile?.tags;
  return Array.isArray(tags) ? tags.filter((v): v is string => typeof v === "string") : [];
}

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
  const tags = readTags(ai);
  const sessionTemplate = readString(ai, "session_template");
  const defaultDuration = readNumber(ai, "default_duration_minutes");
  const defaultFrequency = readString(ai, "default_frequency");
  const defaultWindow = readString(ai, "default_take_window");

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title={therapy.name} subtitle={snakeCaseToLabel(therapy.category)} />

      {/* Badges */}
      <View style={styles.badgeRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{snakeCaseToLabel(therapy.category)}</Text>
        </View>
        {ai && (
          <View style={[styles.categoryBadge, styles.infoBadge]}>
            <FontAwesome name="bolt" size={10} color={colors.primary} />
            <Text style={styles.infoBadgeText}> Profile</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {therapy.description && (
        <Text style={styles.description}>{therapy.description}</Text>
      )}

      {/* Defaults card */}
      {(defaultDuration || defaultFrequency || defaultWindow) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Defaults</Text>
          <View style={styles.defaultsGrid}>
            {defaultDuration != null && (
              <View style={styles.defaultItem}>
                <FontAwesome name="clock-o" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.defaultLabel}>Duration</Text>
                  <Text style={styles.defaultValue}>{defaultDuration} min</Text>
                </View>
              </View>
            )}
            {defaultFrequency && (
              <View style={styles.defaultItem}>
                <FontAwesome name="repeat" size={14} color={colors.primary} />
                <View>
                  <Text style={styles.defaultLabel}>Frequency</Text>
                  <Text style={styles.defaultValue}>{snakeCaseToLabel(defaultFrequency)}</Text>
                </View>
              </View>
            )}
            {defaultWindow && (
              <View style={styles.defaultItem}>
                <FontAwesome name="sun-o" size={15} color={colors.primary} />
                <View>
                  <Text style={styles.defaultLabel}>Time Window</Text>
                  <Text style={styles.defaultValue}>{snakeCaseToLabel(defaultWindow)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Session template */}
      {sessionTemplate && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session Template</Text>
          <View style={styles.templateBox}>
            <FontAwesome name="list-ol" size={14} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.templateText}>{sessionTemplate}</Text>
          </View>
        </View>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Start button */}
      <Link href={`/therapy/${therapy.id}/schedule`} asChild>
        <Pressable style={styles.primaryButton} accessibilityRole="button" accessibilityLabel="Start Protocol">
          <FontAwesome name="play" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Start Protocol</Text>
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
  defaultsGrid: {
    gap: 14,
  },
  defaultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
  },
  templateText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDarker,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
