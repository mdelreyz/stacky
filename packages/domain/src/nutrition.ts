export interface NutritionPhase {
  name: string;
  duration_days: number;
  macros: {
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    calories_kcal: number;
  };
  notes: string | null;
}

export interface NutritionCycle {
  id: string;
  cycle_type: string;
  name: string;
  phases: NutritionPhase[];
  current_phase_idx: number;
  phase_started_at: string;
  next_transition: string;
  is_active: boolean;
}
