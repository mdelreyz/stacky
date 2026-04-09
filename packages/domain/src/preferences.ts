export type InteractionMode = "expert" | "advanced" | "automated" | "guided";

export type HealthGoal =
  | "longevity"
  | "cognitive"
  | "sleep"
  | "stress"
  | "energy"
  | "immunity"
  | "skin"
  | "hair"
  | "joint_health"
  | "gut_health"
  | "weight_management"
  | "muscle_recovery"
  | "cardiovascular"
  | "hormonal_balance";

export interface UserPreferences {
  id: string;
  interaction_mode: InteractionMode;
  max_supplements_per_day: number | null;
  max_tablets_per_day: number | null;
  max_medications: number | null;
  exercise_blocks_per_week: number | null;
  exercise_minutes_per_day: number | null;
  primary_goals: HealthGoal[] | null;
  focus_concerns: string[] | null;
  excluded_ingredients: string[] | null;
  age: number | null;
  biological_sex: "male" | "female" | "other" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesUpdate {
  interaction_mode?: InteractionMode;
  max_supplements_per_day?: number | null;
  max_tablets_per_day?: number | null;
  max_medications?: number | null;
  exercise_blocks_per_week?: number | null;
  exercise_minutes_per_day?: number | null;
  primary_goals?: HealthGoal[] | null;
  focus_concerns?: string[] | null;
  excluded_ingredients?: string[] | null;
  age?: number | null;
  biological_sex?: "male" | "female" | "other" | null;
  notes?: string | null;
}

export type RecommendationItemType = "supplement" | "medication" | "therapy" | "peptide";

export interface RecommendedItem {
  catalog_id: string;
  item_type: RecommendationItemType;
  name: string;
  category: string;
  reason: string;
  priority_rank: number;
  suggested_dosage: string | null;
  suggested_window: string | null;
}

export interface RecommendationResponse {
  items: RecommendedItem[];
  reasoning_summary: string;
  goals_used: string[];
  slot_budget: number;
  items_excluded_current: number;
}

export interface AppliedItem {
  user_item_id: string;
  item_type: RecommendationItemType;
  catalog_id: string;
  name: string;
}

export interface ApplyRecommendationsResponse {
  applied: AppliedItem[];
  protocol_id: string | null;
  protocol_name: string | null;
}

export type InteractionSeverity = "critical" | "major" | "moderate" | "minor";
export type InteractionType = "contraindication" | "caution";

export interface InteractionWarning {
  item_a: string;
  item_b: string;
  interaction_type: InteractionType;
  severity: InteractionSeverity;
  description: string;
}

export interface InteractionCheckResponse {
  warnings: InteractionWarning[];
  has_critical: boolean;
  has_major: boolean;
  total_warnings: number;
}

// ── Stack Score ─────────────────────────────────────────────────────

export interface ScoreDimension {
  name: string;
  score: number;
  weight: number;
  details: string;
}

export interface SynergyPair {
  item_a: string;
  item_b: string;
  benefit: string;
}

export interface StackScoreResponse {
  total_score: number;
  dimensions: ScoreDimension[];
  synergies_found: SynergyPair[];
  suggestions: string[];
  item_count: number;
}

// ── Guided Wizard ───────────────────────────────────────────────────

export interface WizardTurn {
  role: "user" | "assistant";
  content: string;
}

export interface WizardRecommendedItem {
  name: string;
  item_type: string;
  reason: string;
  suggested_dosage: string | null;
  suggested_window: string | null;
}

export interface WizardResponse {
  assistant_message: string;
  conversation: WizardTurn[];
  is_complete: boolean;
  extracted_preferences: Record<string, unknown> | null;
  recommended_items: WizardRecommendedItem[] | null;
  protocol_name: string | null;
  summary: string | null;
}
