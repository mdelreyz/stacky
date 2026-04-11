export interface GoalSupportingItem {
  id: string;
  name: string;
  type: string;
  adherence_rate: number | null;
  taken_count: number;
  total_count: number;
}

export interface GoalTrendPoint {
  date: string;
  value: number;
}

export interface GoalProgressItem {
  goal: string;
  label: string;
  icon: string;
  item_count: number;
  adherence_rate: number | null;
  supporting_items: GoalSupportingItem[];
  journal_metric: string | null;
  journal_avg: number | null;
  journal_trend: GoalTrendPoint[];
}

export interface GoalProgressResponse {
  goals: GoalProgressItem[];
  has_preferences: boolean;
  period_days: number | null;
  start_date: string | null;
  end_date: string | null;
}
