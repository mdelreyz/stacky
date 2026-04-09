import type { TakeWindow } from "./user-items";

export interface TrackingOverview {
  window_days: number;
  start_date: string;
  end_date: string;
  item_type_filter: "supplement" | "medication" | "therapy" | "peptide" | null;
  scheduled_count: number;
  taken_count: number;
  skipped_count: number;
  pending_count: number;
  completion_rate: number;
  current_streak_days: number;
  daily_completion: Record<string, boolean | null>;
  item_stats: TrackingItemStat[];
  recent_events: TrackingEvent[];
  suggestions: TrackingSuggestion[];
}

export interface TrackingItemStat {
  item_id: string;
  item_name: string;
  item_type: "supplement" | "medication" | "therapy" | "peptide";
  take_window: TakeWindow;
  regimes: string[];
  scheduled_count: number;
  taken_count: number;
  skipped_count: number;
  pending_count: number;
  completion_rate: number;
  last_taken_at: string | null;
}

export interface TrackingEvent {
  item_id: string;
  item_name: string;
  item_type: "supplement" | "medication" | "therapy" | "peptide";
  take_window: TakeWindow | null;
  status: "taken" | "skipped";
  scheduled_at: string;
  taken_at: string | null;
  skip_reason: string | null;
  regimes: string[];
}

export interface TrackingSuggestion {
  item_id: string | null;
  item_name: string | null;
  item_type: "supplement" | "medication" | "therapy" | "peptide" | "overall";
  headline: string;
  recommendation: string;
}

export interface BatchAdherenceItemResult {
  item_id: string;
  item_type: "supplement" | "medication" | "therapy" | "peptide";
  item_name: string;
  status: "taken" | "skipped";
  scheduled_at: string;
  taken_at: string | null;
  skip_reason: string | null;
}

export interface BatchAdherenceResponse {
  protocol_id: string;
  protocol_name: string;
  date: string;
  status: "taken" | "skipped";
  items_marked: BatchAdherenceItemResult[];
  items_not_due: string[];
}
