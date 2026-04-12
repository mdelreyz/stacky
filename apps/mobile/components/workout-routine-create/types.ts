import type { Exercise } from "@protocols/domain";

export interface ExerciseEntry {
  exercise: Exercise;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
  notes?: string;
}
