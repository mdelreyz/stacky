export interface DailyAdherenceRate {
  date: string;
  taken: number;
  total: number;
  rate: number | null;
}

export interface DigestAdherence {
  taken_count: number;
  skipped_count: number;
  total_logged: number;
  completion_rate: number;
  daily_rates: DailyAdherenceRate[];
  best_day: string | null;
  worst_day: string | null;
}

export interface DigestJournal {
  entry_count: number;
  avg_energy: number | null;
  avg_mood: number | null;
  avg_sleep: number | null;
  avg_stress: number | null;
  symptom_frequency: Record<string, number>;
}

export interface DigestExercise {
  session_count: number;
  total_sets: number;
  total_volume: number;
}

export interface DigestMetricDelta {
  current: number | null;
  previous: number | null;
  delta: number | null;
}

export interface WeeklyDigestComparison {
  previous_week_start: string;
  previous_week_end: string;
  adherence_completion_rate: DigestMetricDelta;
  journal_entry_count: DigestMetricDelta;
  journal_avg_energy: DigestMetricDelta;
  exercise_session_count: DigestMetricDelta;
  exercise_total_volume: DigestMetricDelta;
}

export interface MonthlyDigestComparison {
  current_month_start: string;
  current_month_end: string;
  previous_month_start: string;
  previous_month_end: string;
  adherence_completion_rate: DigestMetricDelta;
  journal_entry_count: DigestMetricDelta;
  journal_avg_energy: DigestMetricDelta;
  exercise_session_count: DigestMetricDelta;
  exercise_total_volume: DigestMetricDelta;
}

export interface WeeklyDigest {
  week_start: string;
  week_end: string;
  adherence: DigestAdherence;
  journal: DigestJournal;
  exercise: DigestExercise;
  highlights: string[];
  comparison: WeeklyDigestComparison;
  monthly_comparison: MonthlyDigestComparison;
}
