import { Pressable, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

import type { ExerciseEntry } from "./types";
import { styles } from "./styles";

function parseOptionalNumber(value: string) {
  return value ? Number(value) : undefined;
}

export function RoutineExerciseListSection({
  exercises,
  moveExercise,
  openPicker,
  removeExercise,
  updateExercise,
}: {
  exercises: ExerciseEntry[];
  moveExercise: (index: number, direction: -1 | 1) => void;
  openPicker: () => void;
  removeExercise: (index: number) => void;
  updateExercise: (index: number, updates: Partial<ExerciseEntry>) => void;
}) {
  return (
    <View style={styles.exerciseSection}>
      <View style={styles.exercisesHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Routine Exercises</Text>
          <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addExBtn, pressed && styles.softPressed]}
          onPress={openPicker}
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
                  {entry.exercise.category} · {entry.exercise.primary_muscle}
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
            <NumericTargetField
              label="Sets"
              placeholder="3"
              value={entry.target_sets}
              onChangeText={(value) => updateExercise(index, { target_sets: parseOptionalNumber(value) })}
            />
            <NumericTargetField
              label="Reps"
              placeholder="10"
              value={entry.target_reps}
              onChangeText={(value) => updateExercise(index, { target_reps: parseOptionalNumber(value) })}
            />
            <NumericTargetField
              label="Weight"
              placeholder="kg"
              value={entry.target_weight}
              onChangeText={(value) => updateExercise(index, { target_weight: parseOptionalNumber(value) })}
            />
            <NumericTargetField
              label="Rest(s)"
              placeholder="90"
              value={entry.rest_seconds}
              onChangeText={(value) => updateExercise(index, { rest_seconds: parseOptionalNumber(value) })}
            />
          </View>
        </View>
      ))}

      {exercises.length === 0 ? (
        <Pressable
          style={({ pressed }) => [styles.emptyExercises, pressed && styles.softPressed]}
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel="Tap to add exercises"
        >
          <View style={styles.emptyIcon}>
            <FontAwesome name="plus-circle" size={20} color={colors.primaryDark} />
          </View>
          <Text style={styles.emptyTitle}>Add your first exercise</Text>
          <Text style={styles.emptyText}>Search the catalog or bring in a custom movement.</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function NumericTargetField({
  label,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value?: number;
}) {
  return (
    <View style={styles.targetField}>
      <Text style={styles.targetLabel}>{label}</Text>
      <TextInput
        style={styles.targetInput}
        value={value?.toString() ?? ""}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
      />
    </View>
  );
}
