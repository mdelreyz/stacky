export type CycleType = "on_off" | "taper" | "ramp" | "custom";
export type CyclePhase = "on" | "off" | "taper_up" | "taper_down";

export interface CyclingSchedule {
  id: string;
  item_type: "supplement" | "therapy" | "nutrition";
  item_id: string;
  cycle_type: CycleType;
  on_duration_days: number;
  off_duration_days: number;
  current_phase: CyclePhase;
  phase_started_at: string;
  next_transition: string;
  is_active: boolean;
}
