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

export interface WeeklyDigest {
  week_start: string;
  week_end: string;
  adherence: DigestAdherence;
  journal: DigestJournal;
  exercise: DigestExercise;
  highlights: string[];
}
