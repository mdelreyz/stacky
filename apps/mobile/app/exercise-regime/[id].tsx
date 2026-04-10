import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

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
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title={regime.name}
        subtitle={regime.description || `${regime.schedule_entries.length} training days`}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        {DAY_ORDER.map((day) => {
          const entry = scheduleByDay[day];
          return (
            <View key={day} style={styles.dayRow}>
              <Text style={[styles.dayLabel, !entry && styles.dayLabelRest]}>{DAY_LABELS[day]}</Text>
              {entry ? (
                <Pressable
                  style={styles.routineCard}
                  accessibilityRole="button"
                  accessibilityLabel={`View routine: ${entry.routine.name}`}
                  onPress={() => router.push(`/workout-routine/${entry.routine_id}`)}
                >
                  <Text style={styles.routineName}>{entry.routine.name}</Text>
                  <Text style={styles.routineMeta}>
                    {entry.routine.exercises.length} exercises
                  </Text>
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

      <View style={styles.section}>
        <Pressable
          style={styles.deleteBtn}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Deactivate Regime"
        >
          <FontAwesome name="trash-o" size={14} color={colors.danger} />
          <Text style={styles.deleteBtnText}>Deactivate Regime</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  errorText: { fontSize: 16, color: colors.textMuted },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },

  dayRow: { marginBottom: 10 },
  dayLabel: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 4 },
  dayLabelRest: { color: colors.textMuted },
  routineCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 12,
  },
  routineName: { fontSize: 15, fontWeight: "600", color: colors.primaryDark },
  routineMeta: { fontSize: 12, color: colors.primary, marginTop: 2 },
  restCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
  },
  restText: { fontSize: 14, color: colors.textMuted },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: colors.danger },
});
