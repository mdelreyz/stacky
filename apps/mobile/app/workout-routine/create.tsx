import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
      <View style={styles.pickerScreen}>
        <AmbientBackdrop canvasStyle={styles.pickerBackdrop} />
        <FadeInView style={styles.pickerShell}>
          <View style={styles.pickerHeader}>
            <Pressable
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => [styles.pickerIconButton, pressed && styles.softPressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
            </Pressable>
            <View style={styles.pickerTitleWrap}>
              <Text style={styles.pickerEyebrow}>Routine Builder</Text>
              <Text style={styles.pickerTitle}>Add Exercises ({exercises.length})</Text>
            </View>
            <Pressable
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => [styles.pickerDoneButton, pressed && styles.softPressed]}
              accessibilityRole="button"
              accessibilityLabel="Done adding exercises"
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.pickerBody}>
            <ExerciseSearchPicker
              onSelect={handleSelectExercise}
              selectedIds={exercises.map((e) => e.exercise.id)}
            />
          </View>
        </FadeInView>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title="New Routine" subtitle="Build a workout template with target exercises" />

        <View style={styles.form}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewGlow} />
            <Text style={styles.overviewEyebrow}>Workout Template</Text>
            <Text style={styles.overviewTitle}>Shape a polished routine before you train.</Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{exercises.length}</Text>
                <Text style={styles.overviewStatLabel}>Exercises</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{duration || "--"}</Text>
                <Text style={styles.overviewStatLabel}>Minutes</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
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
              style={[styles.input, styles.inputMultiline]}
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
          </View>

          <View style={styles.exerciseSection}>
            <View style={styles.exercisesHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Routine Exercises</Text>
                <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.addExBtn, pressed && styles.softPressed]}
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Add exercises"
              >
                <FontAwesome name="plus" size={12} color={colors.primaryDark} />
                <Text style={styles.addExText}>Add</Text>
              </Pressable>
            </View>

            {exercises.map((entry, index) => (
              <View key={entry.exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <View style={styles.exerciseCardTitleRow}>
                    <View style={styles.exerciseNumBadge}>
                      <Text style={styles.exerciseNum}>{index + 1}</Text>
                    </View>
                    <View style={styles.exerciseTitleBlock}>
                      <Text style={styles.exerciseName}>{entry.exercise.name}</Text>
                      <Text style={styles.exerciseSubtitle}>
                        {entry.exercise.category} \u00b7 {entry.exercise.primary_muscle}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.exerciseActions}>
                    <Pressable
                      onPress={() => moveExercise(index, -1)}
                      style={({ pressed }) => [styles.iconAction, pressed && styles.softPressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${entry.exercise.name} up`}
                    >
                      <FontAwesome name="arrow-up" size={14} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                      onPress={() => moveExercise(index, 1)}
                      style={({ pressed }) => [styles.iconAction, pressed && styles.softPressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${entry.exercise.name} down`}
                    >
                      <FontAwesome name="arrow-down" size={14} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                      onPress={() => removeExercise(index)}
                      style={({ pressed }) => [
                        styles.iconAction,
                        styles.iconActionDanger,
                        pressed && styles.softPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${entry.exercise.name}`}
                    >
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
              <Pressable
                style={({ pressed }) => [styles.emptyExercises, pressed && styles.softPressed]}
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Tap to add exercises"
              >
                <View style={styles.emptyIcon}>
                  <FontAwesome name="plus-circle" size={20} color={colors.primaryDark} />
                </View>
                <Text style={styles.emptyTitle}>Add your first exercise</Text>
                <Text style={styles.emptyText}>Search the catalog or bring in a custom movement.</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                saving && styles.saveBtnDisabled,
                pressed && !saving && styles.buttonPressed,
              ]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Create Routine"
            >
              <FontAwesome name="check-circle" size={16} color={colors.textWhite} />
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Create Routine"}</Text>
            </Pressable>
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1260 },
  form: { paddingHorizontal: 16, gap: 18 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginTop: 8 },
  input: {
    backgroundColor: "rgba(248,251,255,0.84)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  inputMultiline: { height: 72, textAlignVertical: "top" },

  pickerScreen: { flex: 1, backgroundColor: colors.backgroundSecondary },
  pickerBackdrop: { top: -42, height: 920 },
  pickerShell: { flex: 1, paddingHorizontal: 16, paddingBottom: 18 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  pickerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,248,251,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  pickerTitleWrap: { flex: 1, paddingHorizontal: 12 },
  pickerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 2,
  },
  pickerTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  pickerDoneButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(236,244,250,0.92)",
  },
  pickerDoneText: { fontSize: 14, fontWeight: "700", color: colors.primaryDark },
  pickerBody: { flex: 1, paddingTop: 16 },

  overviewCard: {
    marginHorizontal: 4,
    padding: 22,
    borderRadius: 28,
    backgroundColor: "rgba(43,77,111,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 4,
    overflow: "hidden",
  },
  overviewGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -44,
    right: -8,
  },
  overviewEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.66)",
  },
  overviewTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.textWhite,
    marginTop: 8,
    maxWidth: "82%",
  },
  overviewStats: { flexDirection: "row", gap: 12, marginTop: 18 },
  overviewStat: {
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  overviewStatValue: { fontSize: 20, fontWeight: "700", color: colors.textWhite },
  overviewStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 4 },

  formCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },

  exerciseSection: { gap: 10 },
  exercisesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 3,
  },
  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "rgba(238,245,250,0.92)",
    borderWidth: 1,
    borderColor: "rgba(104,138,160,0.18)",
  },
  addExText: { fontSize: 14, fontWeight: "700", color: colors.primaryDark },

  exerciseCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  exerciseCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exerciseCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  exerciseNumBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(237,245,252,0.92)",
  },
  exerciseNum: { fontSize: 13, fontWeight: "700", color: colors.primaryDark },
  exerciseTitleBlock: { flex: 1, gap: 2 },
  exerciseName: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  exerciseSubtitle: { fontSize: 12, color: colors.textMuted },
  exerciseActions: { flexDirection: "row", gap: 8, marginLeft: 12 },
  iconAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,248,251,0.92)",
  },
  iconActionDanger: { backgroundColor: "rgba(253,241,241,0.92)" },

  targetsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  targetField: { flex: 1 },
  targetLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 6, marginLeft: 4 },
  targetInput: {
    backgroundColor: "rgba(248,251,255,0.92)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },

  emptyExercises: {
    backgroundColor: "rgba(255,255,255,0.62)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderStyle: "dashed",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(237,245,252,0.94)",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },

  footer: { paddingTop: 2, paddingBottom: 8 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
