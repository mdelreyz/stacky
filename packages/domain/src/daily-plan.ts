import type { TakeWindow } from "./user-items";
import type { NutritionPhase } from "./nutrition";

export interface DailyPlan {
  date: string;
  windows: TakeWindowPlan[];
  nutrition_phase: NutritionPhase | null;
  cycle_alerts: CycleAlert[];
  interactions: InteractionWarning[];
}

export interface TakeWindowPlan {
  window: TakeWindow;
  display_time: string;
  items: DailyPlanItem[];
}

export interface DailyPlanItem {
  id: string;
  name: string;
  type: "supplement" | "therapy";
  details: string | null;
  instructions: string;
  is_on_cycle: boolean;
  adherence_status: "pending" | "taken" | "skipped";
}

export interface CycleAlert {
  item_name: string;
  message: string;
  days_until_transition: number;
}

export interface InteractionWarning {
  supplement_a: string;
  supplement_b: string;
  type: "contraindication" | "caution";
  severity: "critical" | "major" | "moderate" | "minor";
  description: string;
}

export interface AdherenceResult {
  item_id: string;
  status: "taken" | "skipped";
  scheduled_at: string;
  taken_at: string | null;
  skip_reason: string | null;
}

export type SupplementAdherenceResult = AdherenceResult;
