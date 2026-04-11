import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supplements as supplementsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { Supplement } from "@/lib/api";
import { SupplementAIProfileContent } from "@/components/supplement-detail/SupplementAIProfileContent";
import { SupplementDetailHero } from "@/components/supplement-detail/SupplementDetailHero";
import { SupplementProfileFallback } from "@/components/supplement-detail/SupplementProfileFallback";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import type { SupplementAIProfile } from "@protocols/domain";

const POLL_INTERVAL_MS = 2500;
const MAX_GENERATION_WAIT_MS = 20000;

export default function SupplementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generationDelayNotice, setGenerationDelayNotice] = useState<string | null>(null);

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

        const isGenerating = nextSupplement.ai_status === "generating" && !nextSupplement.ai_profile;
        setGenerationDelayNotice(
          isGenerating && Date.now() - startedAt >= MAX_GENERATION_WAIT_MS
            ? "AI profile generation is taking longer than expected. We're still checking automatically."
            : null,
        );

        setSupplement(nextSupplement);

        if (isGenerating) {
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
  }, [id, refreshKey]);

  const handleRetry = async () => {
    if (!supplement) return;

    setRetrying(true);
    setGenerationDelayNotice(null);
    try {
      const result = await supplementsApi.onboard({
        name: supplement.name,
        category: supplement.category,
        form: supplement.form ?? undefined,
      });
      setSupplement((current) =>
        current
          ? {
              ...current,
              ai_profile: result.ai_profile as Supplement["ai_profile"],
              ai_status: result.status,
              ai_error: result.ai_error,
            }
          : current,
      );
      setRefreshKey((current) => current + 1);
    } catch (error: any) {
      showError(error.message || "Failed to retry supplement generation");
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!supplement || supplement.source !== "user_created") return;

    setDeleting(true);
    try {
      await supplementsApi.delete(supplement.id);
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to delete supplement");
      setDeleting(false);
    }
  };

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <SupplementDetailHero
          supplement={supplement}
          onBack={() => router.back()}
          onAddToProtocol={() => router.push(`/supplement/${supplement.id}/schedule`)}
          onDelete={handleDelete}
          deleting={deleting}
        />

        {ai ? (
          <SupplementAIProfileContent ai={ai} supplement={supplement} />
        ) : supplement.ai_status === "failed" ? (
          <SupplementProfileFallback
            status="failed"
            error={supplement.ai_error}
            onRetry={handleRetry}
            retrying={retrying}
          />
        ) : (
          <SupplementProfileFallback status="generating" error={generationDelayNotice} />
        )}
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 980 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
});
