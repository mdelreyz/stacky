export type NutritionCycleType = "macro_profile" | "named_diet" | "elimination" | "custom";
export type MacroLevel = "low" | "medium" | "high";

export interface NutritionMacroProfile {
  carbs: MacroLevel;
  protein: MacroLevel;
  fat: MacroLevel;
}

export interface NutritionPhase {
  name: string;
  duration_days: number;
  macro_profile: NutritionMacroProfile | null;
  pattern: string | null;
  restrictions: string[];
  notes: string | null;
}

export interface ActiveNutritionPhase extends NutritionPhase {
  plan_name: string;
  cycle_type: NutritionCycleType;
  current_phase_idx: number;
  total_phases: number;
  next_transition: string;
  days_until_transition: number;
}

export interface NutritionCycle {
  id: string;
  cycle_type: NutritionCycleType;
  name: string;
  phases: NutritionPhase[];
  current_phase_idx: number;
  phase_started_at: string;
  next_transition: string;
  is_active: boolean;
}
