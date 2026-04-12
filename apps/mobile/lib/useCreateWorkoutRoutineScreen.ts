import { useState } from "react";
import { router } from "expo-router";

import { workoutRoutines as routinesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { Exercise, RoutineExerciseInput } from "@protocols/domain";

import type { ExerciseEntry } from "@/components/workout-routine-create/types";

export function useCreateWorkoutRoutineScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleSelectExercise(exercise: Exercise) {
    setExercises((current) => {
      const exists = current.find((entry) => entry.exercise.id === exercise.id);
      if (exists) {
        return current.filter((entry) => entry.exercise.id !== exercise.id);
      }
      return [...current, { exercise, target_sets: 3, target_reps: 10 }];
    });
  }

  function updateExercise(index: number, updates: Partial<ExerciseEntry>) {
    setExercises((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }

  function removeExercise(index: number) {
    setExercises((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setExercises((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      showError("Enter a routine name");
      return;
    }

    setSaving(true);
    try {
      const exerciseInputs: RoutineExerciseInput[] = exercises.map((entry, index) => ({
        exercise_id: entry.exercise.id,
        sort_order: index,
        target_sets: entry.target_sets,
        target_reps: entry.target_reps,
        target_weight: entry.target_weight,
        rest_seconds: entry.rest_seconds,
        notes: entry.notes,
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
  }

  return {
    description,
    duration,
    exercises,
    handleSave,
    handleSelectExercise,
    moveExercise,
    name,
    removeExercise,
    saving,
    setDescription,
    setDuration,
    setName,
    setShowPicker,
    showPicker,
    updateExercise,
  };
}
