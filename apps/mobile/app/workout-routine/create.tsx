import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { ExerciseSearchPicker } from "@/components/exercise/ExerciseSearchPicker";
import { workoutRoutines as routinesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { Exercise, RoutineExerciseInput } from "@protocols/domain";

interface ExerciseEntry {
  exercise: Exercise;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
  notes?: string;
}

export default function CreateRoutineScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelectExercise = (exercise: Exercise) => {
    const exists = exercises.find((e) => e.exercise.id === exercise.id);
    if (exists) {
      setExercises(exercises.filter((e) => e.exercise.id !== exercise.id));
    } else {
      setExercises([...exercises, { exercise, target_sets: 3, target_reps: 10 }]);
    }
  };

  const updateExercise = (index: number, updates: Partial<ExerciseEntry>) => {
    const next = [...exercises];
    next[index] = { ...next[index], ...updates };
    setExercises(next);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= exercises.length) return;
    const next = [...exercises];
    [next[index], next[target]] = [next[target], next[index]];
    setExercises(next);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Enter a routine name");
      return;
    }
    setSaving(true);
    try {
      const exerciseInputs: RoutineExerciseInput[] = exercises.map((e, i) => ({
        exercise_id: e.exercise.id,
        sort_order: i,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        target_weight: e.target_weight,
        rest_seconds: e.rest_seconds,
        notes: e.notes,
      }));
      await routinesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        estimated_duration_minutes: duration ? Number(duration) : undefined,
        exercises: exerciseInputs,
      });
      router.replace("/(tabs)/exercise");
    } catch (error: any) {
      showError(error?.message || "Failed to create routine");
    } finally {
      setSaving(false);
    }
  };

  if (showPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Pressable onPress={() => setShowPicker(false)} style={styles.pickerDone}>
            <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.pickerTitle}>
            Add Exercises ({exercises.length} selected)
          </Text>
          <Pressable onPress={() => setShowPicker(false)} style={styles.pickerDone}>
            <Text style={styles.pickerDoneText}>Done</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <ExerciseSearchPicker
            onSelect={handleSelectExercise}
            selectedIds={exercises.map((e) => e.exercise.id)}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <FlowScreenHeader title="New Routine" subtitle="Build a workout template with target exercises" />

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push Day, Upper Body, Leg Day"
          placeholderTextColor={colors.textPlaceholder}
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe this routine..."
          placeholderTextColor={colors.textPlaceholder}
          multiline
        />

        <Text style={styles.label}>Estimated Duration (min)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="e.g. 60"
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="numeric"
        />

        {/* Exercises */}
        <View style={styles.exercisesHeader}>
          <Text style={styles.label}>Exercises ({exercises.length})</Text>
          <Pressable style={styles.addExBtn} onPress={() => setShowPicker(true)}>
            <FontAwesome name="plus" size={12} color={colors.primary} />
            <Text style={styles.addExText}>Add</Text>
          </Pressable>
        </View>

        {exercises.map((entry, index) => (
          <View key={entry.exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseCardHeader}>
              <View style={styles.exerciseCardTitleRow}>
                <Text style={styles.exerciseNum}>{index + 1}</Text>
                <Text style={styles.exerciseName}>{entry.exercise.name}</Text>
              </View>
              <View style={styles.exerciseActions}>
                <Pressable onPress={() => moveExercise(index, -1)}>
                  <FontAwesome name="arrow-up" size={14} color={colors.textMuted} />
                </Pressable>
                <Pressable onPress={() => moveExercise(index, 1)}>
                  <FontAwesome name="arrow-down" size={14} color={colors.textMuted} />
                </Pressable>
                <Pressable onPress={() => removeExercise(index)}>
                  <FontAwesome name="trash-o" size={14} color={colors.danger} />
                </Pressable>
              </View>
            </View>
            <View style={styles.targetsRow}>
              <View style={styles.targetField}>
                <Text style={styles.targetLabel}>Sets</Text>
                <TextInput
                  style={styles.targetInput}
                  value={entry.target_sets?.toString() ?? ""}
                  onChangeText={(v) => updateExercise(index, { target_sets: v ? Number(v) : undefined })}
                  keyboardType="numeric"
                  placeholder="3"
                  placeholderTextColor={colors.textPlaceholder}
                />
              </View>
              <View style={styles.targetField}>
                <Text style={styles.targetLabel}>Reps</Text>
                <TextInput
                  style={styles.targetInput}
                  value={entry.target_reps?.toString() ?? ""}
                  onChangeText={(v) => updateExercise(index, { target_reps: v ? Number(v) : undefined })}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.textPlaceholder}
                />
              </View>
              <View style={styles.targetField}>
                <Text style={styles.targetLabel}>Weight</Text>
                <TextInput
                  style={styles.targetInput}
                  value={entry.target_weight?.toString() ?? ""}
                  onChangeText={(v) => updateExercise(index, { target_weight: v ? Number(v) : undefined })}
                  keyboardType="numeric"
                  placeholder="kg"
                  placeholderTextColor={colors.textPlaceholder}
                />
              </View>
              <View style={styles.targetField}>
                <Text style={styles.targetLabel}>Rest(s)</Text>
                <TextInput
                  style={styles.targetInput}
                  value={entry.rest_seconds?.toString() ?? ""}
                  onChangeText={(v) => updateExercise(index, { rest_seconds: v ? Number(v) : undefined })}
                  keyboardType="numeric"
                  placeholder="90"
                  placeholderTextColor={colors.textPlaceholder}
                />
              </View>
            </View>
          </View>
        ))}

        {exercises.length === 0 && (
          <Pressable style={styles.emptyExercises} onPress={() => setShowPicker(true)}>
            <FontAwesome name="plus-circle" size={24} color={colors.textMuted} />
            <Text style={styles.emptyText}>Tap to add exercises</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Create Routine"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { paddingHorizontal: 20, gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Exercise picker header
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  pickerDone: { padding: 4 },
  pickerDoneText: { fontSize: 15, fontWeight: "600", color: colors.primary },

  // Exercises section
  exercisesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  addExBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  addExText: { fontSize: 14, fontWeight: "600", color: colors.primary },

  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  exerciseCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exerciseCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  exerciseNum: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  exerciseName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  exerciseActions: { flexDirection: "row", gap: 12 },

  targetsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  targetField: { flex: 1 },
  targetLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  targetInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "center",
  },

  emptyExercises: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  emptyText: { fontSize: 14, color: colors.textMuted },

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
