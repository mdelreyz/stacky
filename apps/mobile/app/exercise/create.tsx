import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { exercises as exercisesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { ExerciseCategory, ExerciseEquipment, MuscleGroup } from "@protocols/domain";

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "compound", label: "Compound" },
  { value: "isolation", label: "Isolation" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "plyometric", label: "Plyometric" },
  { value: "olympic", label: "Olympic" },
];

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "forearms", label: "Forearms" },
  { value: "quadriceps", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "core", label: "Core" },
  { value: "full_body", label: "Full Body" },
  { value: "cardio", label: "Cardio" },
];

const EQUIPMENT: { value: ExerciseEquipment; label: string }[] = [
  { value: "bodyweight", label: "Bodyweight" },
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "cable", label: "Cable" },
  { value: "machine", label: "Machine" },
  { value: "smith_machine", label: "Smith Machine" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "resistance_band", label: "Resistance Band" },
  { value: "ez_bar", label: "EZ Bar" },
  { value: "trap_bar", label: "Trap Bar" },
  { value: "none", label: "None" },
];

export default function CreateExerciseScreen() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("compound");
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>("chest");
  const [equipment, setEquipment] = useState<ExerciseEquipment>("bodyweight");
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isCompound, setIsCompound] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleSecondary = (muscle: MuscleGroup) => {
    if (muscle === primaryMuscle) return;
    setSecondaryMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Enter an exercise name");
      return;
    }
    setSaving(true);
    try {
      await exercisesApi.create({
        name: name.trim(),
        category,
        primary_muscle: primaryMuscle,
        equipment,
        secondary_muscles: secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        is_compound: isCompound,
      });
      router.back();
    } catch (error: any) {
      showError(error?.message || "Failed to create exercise");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <FlowScreenHeader
        title="New Exercise"
        subtitle="Create a custom exercise for your routines"
      />

      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Banded Hip Thrust, Neck Curl, PT Stretch"
          placeholderTextColor={colors.textPlaceholder}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipGrid}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              style={[styles.chip, category === c.value && styles.chipSelected]}
              onPress={() => {
                setCategory(c.value);
                setIsCompound(c.value === "compound" || c.value === "olympic");
              }}
            >
              <Text style={[styles.chipText, category === c.value && styles.chipTextSelected]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Primary Muscle</Text>
        <View style={styles.chipGrid}>
          {MUSCLE_GROUPS.map((m) => (
            <Pressable
              key={m.value}
              style={[styles.chip, primaryMuscle === m.value && styles.chipSelected]}
              onPress={() => {
                setPrimaryMuscle(m.value);
                setSecondaryMuscles((prev) => prev.filter((s) => s !== m.value));
              }}
            >
              <Text
                style={[styles.chipText, primaryMuscle === m.value && styles.chipTextSelected]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Equipment</Text>
        <View style={styles.chipGrid}>
          {EQUIPMENT.map((e) => (
            <Pressable
              key={e.value}
              style={[styles.chip, equipment === e.value && styles.chipSelected]}
              onPress={() => setEquipment(e.value)}
            >
              <Text style={[styles.chipText, equipment === e.value && styles.chipTextSelected]}>
                {e.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Secondary Muscles (optional)</Text>
        <View style={styles.chipGrid}>
          {MUSCLE_GROUPS.filter((m) => m.value !== primaryMuscle).map((m) => (
            <Pressable
              key={m.value}
              style={[styles.chip, secondaryMuscles.includes(m.value) && styles.chipSelectedSoft]}
              onPress={() => toggleSecondary(m.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  secondaryMuscles.includes(m.value) && styles.chipTextSelectedSoft,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this exercise?"
          placeholderTextColor={colors.textPlaceholder}
          multiline
        />

        <Text style={styles.label}>Instructions (optional)</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Step-by-step instructions, form cues, tips..."
          placeholderTextColor={colors.textPlaceholder}
          multiline
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <FontAwesome name="plus-circle" size={16} color={colors.textWhite} />
          <Text style={styles.saveBtnText}>{saving ? "Creating..." : "Create Exercise"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { paddingHorizontal: 20, gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipSelectedSoft: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  chipText: { fontSize: 13, fontWeight: "500", color: colors.textSecondary },
  chipTextSelected: { color: colors.primary, fontWeight: "600" },
  chipTextSelectedSoft: { color: colors.success, fontWeight: "600" },

  footer: { padding: 20 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: colors.textWhite },
});
