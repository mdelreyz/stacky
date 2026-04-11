export interface HealthJournalEntry {
  id: string;
  entry_date: string;
  energy_level: number | null;
  mood_level: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  symptoms: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthJournalEntryCreate {
  entry_date: string;
  energy_level?: number | null;
  mood_level?: number | null;
  sleep_quality?: number | null;
  stress_level?: number | null;
  symptoms?: string[] | null;
  notes?: string | null;
}

export interface HealthJournalEntryUpdate {
  energy_level?: number | null;
  mood_level?: number | null;
  sleep_quality?: number | null;
  stress_level?: number | null;
  symptoms?: string[] | null;
  notes?: string | null;
}

export interface HealthJournalTrendPoint {
  date: string;
  value: number;
}

export interface HealthJournalSummary {
  start_date: string;
  end_date: string;
  entry_count: number;
  avg_energy: number | null;
  avg_mood: number | null;
  avg_sleep: number | null;
  avg_stress: number | null;
  symptom_frequency: Record<string, number>;
  trend_energy: HealthJournalTrendPoint[];
  trend_mood: HealthJournalTrendPoint[];
  trend_sleep: HealthJournalTrendPoint[];
}
