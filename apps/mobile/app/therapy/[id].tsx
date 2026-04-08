import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { therapies as therapiesApi } from "@/lib/api";
import type { Therapy } from "@/lib/api";

function readTags(aiProfile: Record<string, unknown> | null): string[] {
  const tags = aiProfile?.tags;
  return Array.isArray(tags) ? tags.filter((value): value is string => typeof value === "string") : [];
}

function readSessionTemplate(aiProfile: Record<string, unknown> | null): string | null {
  const value = aiProfile?.session_template;
  return typeof value === "string" && value.trim() ? value : null;
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
      .then((nextTherapy) => {
        if (!cancelled) {
          setTherapy(nextTherapy);
        }
      })
      .catch(console.error)
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
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  if (!therapy) {
    return (
      <View style={styles.centered}>
        <Text>Protocol not found</Text>
      </View>
    );
  }

  const aiProfile = therapy.ai_profile as Record<string, unknown> | null;
  const tags = readTags(aiProfile);
  const sessionTemplate = readSessionTemplate(aiProfile);

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title={therapy.name} subtitle={therapy.category.replace(/_/g, " ")} />

      {therapy.description ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.bodyText}>{therapy.description}</Text>
        </View>
      ) : null}

      {sessionTemplate ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session Template</Text>
          <Text style={styles.bodyText}>{sessionTemplate}</Text>
        </View>
      ) : null}

      {tags.length > 0 ? (
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
      ) : null}

      <Link href={`/therapy/${therapy.id}/schedule`} asChild>
        <Pressable style={styles.primaryButton}>
          <FontAwesome name="play" size={16} color="#fff" />
          <Text style={styles.primaryButtonText}>Start Protocol</Text>
        </Pressable>
      </Link>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#343a40",
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#495057",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    backgroundColor: "#e7f5ff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1864ab",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: "#228be6",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
