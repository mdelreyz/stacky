// ─── Enums ───────────────────────────────────────────────────────

export type ExerciseCategory =
  | "compound"
  | "isolation"
  | "bodyweight"
  | "cardio"
  | "flexibility"
  | "plyometric"
  | "olympic";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "full_body"
  | "cardio";

export type ExerciseEquipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "smith_machine"
  | "bodyweight"
  | "kettlebell"
  | "resistance_band"
  | "ez_bar"
  | "trap_bar"
  | "none";

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// ─── Exercise Catalog ────────────────────────────────────────────

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  category: ExerciseCategory;
  primary_muscle: MuscleGroup;
  secondary_muscles: string[] | null;
  equipment: ExerciseEquipment;
  description: string | null;
  instructions: string | null;
  is_compound: boolean;
  created_at: string;
}

export interface ExerciseCreate {
  name: string;
  category?: ExerciseCategory;
  primary_muscle?: MuscleGroup;
  secondary_muscles?: string[];
  equipment?: ExerciseEquipment;
  description?: string;
  instructions?: string;
  is_compound?: boolean;
}

export interface ExerciseUpdate {
  name?: string;
  category?: ExerciseCategory;
  primary_muscle?: MuscleGroup;
  secondary_muscles?: string[];
  equipment?: ExerciseEquipment;
  description?: string;
  instructions?: string;
  is_compound?: boolean;
}

// ─── Workout Routines ────────────────────────────────────────────

export interface RoutineExerciseInput {
  exercise_id: string;
  sort_order?: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  target_duration_seconds?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface RoutineExercise {
  id: string;
  exercise_id: string;
  exercise: Exercise;
  sort_order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  target_duration_seconds: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export interface WorkoutRoutine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  estimated_duration_minutes: number | null;
  is_active: boolean;
  exercises: RoutineExercise[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutRoutineListItem {
  id: string;
  name: string;
  description: string | null;
  estimated_duration_minutes: number | null;
  is_active: boolean;
  exercise_count: number;
  created_at: string;
}

export interface WorkoutRoutineCreate {
  name: string;
  description?: string;
  estimated_duration_minutes?: number;
  exercises?: RoutineExerciseInput[];
}

export interface WorkoutRoutineUpdate {
  name?: string;
  description?: string;
  estimated_duration_minutes?: number;
  is_active?: boolean;
}

// ─── Exercise Regimes ────────────────────────────────────────────

export interface RegimeEntryInput {
  routine_id: string;
  day_of_week: WeekDay;
  sort_order?: number;
}

export interface RegimeEntry {
  id: string;
  routine_id: string;
  routine: WorkoutRoutine;
  day_of_week: WeekDay;
  sort_order: number;
}

export interface ExerciseRegime {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  schedule_entries: RegimeEntry[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseRegimeCreate {
  name: string;
  description?: string;
  schedule?: RegimeEntryInput[];
}

export interface ExerciseRegimeUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// ─── Workout Sessions ────────────────────────────────────────────

export interface WorkoutSetInput {
  set_number: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  rpe?: number;
  is_warmup?: boolean;
  is_dropset?: boolean;
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  is_warmup: boolean;
  is_dropset: boolean;
  notes: string | null;
  created_at: string;
}

export interface WorkoutSetUpdate {
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  rpe?: number;
  is_warmup?: boolean;
  is_dropset?: boolean;
  notes?: string;
}

export interface SessionExercise {
  id: string;
  exercise_id: string;
  exercise: Exercise;
  sort_order: number;
  notes: string | null;
  sets: WorkoutSet[];
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_id: string | null;
  regime_id: string | null;
  name: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  logged_exercises: SessionExercise[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionListItem {
  id: string;
  name: string;
  routine_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  location_name: string | null;
  exercise_count: number;
  total_sets: number;
  created_at: string;
}

export interface WorkoutSessionCreate {
  routine_id?: string;
  regime_id?: string;
  name: string;
  started_at: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
}

export interface WorkoutSessionUpdate {
  name?: string;
  completed_at?: string;
  duration_minutes?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
}

// ─── Exercise Stats ──────────────────────────────────────────────

export interface WeeklyOverview {
  week: string;
  sessions: number;
  total_sets: number;
  total_reps: number;
  total_volume: number;
}

export interface ExerciseProgress {
  exercise: Exercise;
  max_weight: number | null;
  estimated_1rm: number | null;
  total_volume: number;
  sessions_count: number;
  history: {
    date: string;
    max_weight: number;
    volume: number;
    sets: number;
    reps: number;
  }[];
}

export interface MuscleGroupVolume {
  muscle_group: MuscleGroup;
  total_volume: number;
  total_sets: number;
  exercise_count: number;
}

export interface ExerciseStatsOverview {
  weekly_summary: WeeklyOverview[];
  total_sessions: number;
  total_volume: number;
  favorite_exercise: string | null;
}

// ─── Gym Locations ───────────────────────────────────────────────

export interface GymLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  default_routine_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GymLocationCreate {
  name: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  default_routine_id?: string;
}

export interface GymLocationUpdate {
  name?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  default_routine_id?: string;
  is_active?: boolean;
}

export interface GymLocationMatch {
  matched: boolean;
  gym_location: GymLocation | null;
  default_routine: WorkoutRoutine | null;
}
