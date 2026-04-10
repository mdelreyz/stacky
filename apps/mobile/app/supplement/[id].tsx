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
import { supplements as supplementsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { Supplement } from "@/lib/api";
import { SupplementAIProfileContent } from "@/components/supplement-detail/SupplementAIProfileContent";
import { SupplementDetailHero } from "@/components/supplement-detail/SupplementDetailHero";
import { SupplementProfileFallback } from "@/components/supplement-detail/SupplementProfileFallback";
import { colors } from "@/constants/Colors";
import type { SupplementAIProfile } from "@protocols/domain";

const POLL_INTERVAL_MS = 2500;
const MAX_GENERATION_WAIT_MS = 20000;

export default function SupplementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const loadSupplement = async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const nextSupplement = await supplementsApi.get(id);
        if (cancelled) return;

        if (
          nextSupplement.ai_status === "generating"
          && !nextSupplement.ai_profile
          && Date.now() - startedAt >= MAX_GENERATION_WAIT_MS
        ) {
          setSupplement({
            ...nextSupplement,
            ai_status: "failed",
            ai_error:
              nextSupplement.ai_error
              || "AI profile generation is taking longer than expected. The background worker or AI provider may be unavailable.",
          });
          return;
        }

        setSupplement(nextSupplement);

        if (nextSupplement.ai_status === "generating" && !nextSupplement.ai_profile) {
          timeoutId = setTimeout(() => {
            void loadSupplement(true);
          }, POLL_INTERVAL_MS);
        }
      } catch (error) {
        showError("Failed to load supplement");
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
        <ActivityIndicator size="large" color={colors.primary} />
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

  const ai = supplement.ai_profile as SupplementAIProfile | null;

  return (
    <ScrollView style={styles.container}>
      <SupplementDetailHero
        supplement={supplement}
        onBack={() => router.back()}
        onAddToProtocol={() => router.push(`/supplement/${supplement.id}/schedule`)}
      />

      {ai ? (
        <SupplementAIProfileContent ai={ai} />
      ) : supplement.ai_status === "failed" ? (
        <SupplementProfileFallback status="failed" error={supplement.ai_error} />
      ) : (
        <SupplementProfileFallback status="generating" error={null} />
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
