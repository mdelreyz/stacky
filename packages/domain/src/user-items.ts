import type { Supplement } from "./supplement";
import type { Therapy } from "./therapy";

export type Frequency =
  | "daily"
  | "twice_daily"
  | "three_times_daily"
  | "weekly"
  | "every_other_day"
  | "as_needed";

export type TakeWindow =
  | "morning_fasted"
  | "morning_with_food"
  | "midday"
  | "afternoon"
  | "evening"
  | "bedtime";

export interface UserSupplement {
  id: string;
  supplement: Supplement;
  dosage_amount: number;
  dosage_unit: string;
  frequency: Frequency;
  take_window: TakeWindow;
  with_food: boolean;
  notes: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface UserTherapy {
  id: string;
  therapy: Therapy;
  duration_minutes: number | null;
  frequency: Frequency;
  take_window: TakeWindow;
  settings: Record<string, unknown> | null;
  notes: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}
