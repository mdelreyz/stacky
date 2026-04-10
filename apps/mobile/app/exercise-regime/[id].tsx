import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { exerciseRegimes as regimesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { ExerciseRegime } from "@/lib/api";

const DAY_LABELS: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function RegimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [regime, setRegime] = useState<ExerciseRegime | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void (async () => {
        try {
          const data = await regimesApi.get(id);
          setRegime(data);
        } catch {
          showError("Failed to load regime");
        } finally {
          setLoading(false);
        }
      })();
    }, [id])
  );

  const handleDelete = async () => {
    if (!id) return;
    try {
      await regimesApi.delete(id);
      router.replace("/(tabs)/exercise");
    } catch {
      showError("Failed to deactivate regime");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!regime) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Regime not found</Text>
      </View>
    );
  }

  const scheduleByDay = Object.fromEntries(
    regime.schedule_entries.map((e) => [e.day_of_week, e])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title={regime.name}
          subtitle={regime.description || `${regime.schedule_entries.length} training days`}
        />

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Training Rhythm</Text>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <View style={styles.scheduleCard}>
            {DAY_ORDER.map((day) => {
              const entry = scheduleByDay[day];
              return (
                <View key={day} style={styles.dayRow}>
                  <Text style={[styles.dayLabel, !entry && styles.dayLabelRest]}>{DAY_LABELS[day]}</Text>
                  {entry ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.routineCard,
                        pressed && styles.softPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`View routine: ${entry.routine.name}`}
                      onPress={() => router.push(`/workout-routine/${entry.routine_id}`)}
                    >
                      <View>
                        <Text style={styles.routineName}>{entry.routine.name}</Text>
                        <Text style={styles.routineMeta}>
                          {entry.routine.exercises.length} exercises
                        </Text>
                      </View>
                      <FontAwesome name="chevron-right" size={13} color={colors.primaryDark} />
                    </Pressable>
                  ) : (
                    <View style={styles.restCard}>
                      <Text style={styles.restText}>Rest Day</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.softPressed]}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Deactivate Regime"
          >
            <FontAwesome name="trash-o" size={14} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Deactivate Regime</Text>
          </Pressable>
        </View>
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1040 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  errorText: { fontSize: 16, color: colors.textMuted },

  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginBottom: 12 },
  scheduleCard: {
    borderRadius: 26,
    padding: 18,
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  dayRow: { gap: 8 },
  dayLabel: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  dayLabelRest: { color: colors.textMuted },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "rgba(236,245,252,0.94)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(104,138,160,0.18)",
  },
  routineName: { fontSize: 15, fontWeight: "600", color: colors.primaryDark },
  routineMeta: { fontSize: 12, color: colors.primary, marginTop: 3 },
  restCard: {
    backgroundColor: "rgba(246,248,251,0.9)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  restText: { fontSize: 14, color: colors.textMuted },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(203,91,91,0.24)",
    paddingVertical: 14,
    backgroundColor: "rgba(255,245,245,0.72)",
  },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: colors.danger },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
