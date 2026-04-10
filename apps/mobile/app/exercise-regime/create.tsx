import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { exerciseRegimes as regimesApi, workoutRoutines as routinesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { RegimeEntryInput, WeekDay, WorkoutRoutineListItem } from "@protocols/domain";

const DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export default function CreateRegimeScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState<Record<WeekDay, string | null>>(
    Object.fromEntries(DAYS.map((d) => [d, null])) as Record<WeekDay, string | null>
  );
  const [routines, setRoutines] = useState<WorkoutRoutineListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const res = await routinesApi.list({ active_only: true });
          setRoutines(res.items);
        } catch {
          showError("Failed to load routines");
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Enter a regime name");
      return;
    }
    const entries: RegimeEntryInput[] = DAYS.filter((d) => schedule[d]).map((d, i) => ({
      routine_id: schedule[d]!,
      day_of_week: d,
      sort_order: i,
    }));
    if (entries.length === 0) {
      showError("Assign at least one day to a routine");
      return;
    }
    setSaving(true);
    try {
      await regimesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        schedule: entries,
      });
      router.replace("/(tabs)/exercise");
    } catch (error: any) {
      showError(error?.message || "Failed to create regime");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <FlowScreenHeader title="New Regime" subtitle="Assign routines to days of the week" />

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push-Pull-Legs, Upper/Lower"
          placeholderTextColor={colors.textPlaceholder}
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe this regime..."
          placeholderTextColor={colors.textPlaceholder}
          multiline
        />

        <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>Weekly Schedule</Text>

        {routines.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Create routines first before building a regime</Text>
          </View>
        )}

        {DAYS.map((day) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayOptions}>
              <Pressable
                style={[styles.routineOption, !schedule[day] && styles.routineOptionSelected]}
                accessibilityRole="button"
                accessibilityLabel={`${DAY_LABELS[day]}: Rest day`}
                accessibilityState={{ selected: !schedule[day] }}
                onPress={() => setSchedule({ ...schedule, [day]: null })}
              >
                <Text style={[styles.routineOptionText, !schedule[day] && styles.routineOptionTextSelected]}>
                  Rest
                </Text>
              </Pressable>
              {routines.map((r) => (
                <Pressable
                  key={r.id}
                  style={[styles.routineOption, schedule[day] === r.id && styles.routineOptionSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`${DAY_LABELS[day]}: ${r.name}`}
                  accessibilityState={{ selected: schedule[day] === r.id }}
                  onPress={() => setSchedule({ ...schedule, [day]: r.id })}
                >
                  <Text
                    style={[styles.routineOptionText, schedule[day] === r.id && styles.routineOptionTextSelected]}
                    numberOfLines={1}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Create Regime"
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Create Regime"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  form: { paddingHorizontal: 20, gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },

  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dayLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  dayOptions: { flexDirection: "row" },
  routineOption: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  routineOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  routineOptionText: { fontSize: 13, color: colors.textSecondary },
  routineOptionTextSelected: { color: colors.primary, fontWeight: "600" },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  emptyText: { fontSize: 13, color: colors.textMuted },

  footer: { padding: 20 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },
});
