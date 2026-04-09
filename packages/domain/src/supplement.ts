export type SupplementCategory =
  | "healthy_aging"
  | "energy_mitochondria"
  | "brain_mood_stress"
  | "sleep_recovery"
  | "cardiovascular"
  | "glucose_metabolic"
  | "gut_digestion"
  | "detox_binding"
  | "immune_antimicrobial"
  | "inflammation_antioxidant"
  | "hormones_fertility"
  | "musculoskeletal"
  | "other";

export interface Supplement {
  id: string;
  name: string;
  category: SupplementCategory;
  form: string | null;
  description: string | null;
  goals: string[] | null;
  mechanism_tags: string[] | null;
  ai_profile: SupplementAIProfile | null;
  ai_status: AIProfileStatus;
  ai_error: string | null;
  ai_generated_at: string | null;
  is_verified: boolean;
}

export interface SupplementRefillRequestItem {
  user_supplement_id: string;
  supplement_name: string;
  dosage_amount: number;
  dosage_unit: string;
  frequency: string;
  take_window: string;
  notes: string | null;
}

export interface SupplementRefillRequest {
  items: SupplementRefillRequestItem[];
  text: string;
}

export type AIProfileStatus = "ready" | "generating" | "failed";

export interface SupplementAIProfile {
  common_names: string[];
  category: string;
  mechanism_of_action: string;
  typical_dosages: {
    amount: number;
    unit: string;
    frequency: string;
    context: string;
  }[];
  forms: string[];
  bioavailability: {
    notes: string;
    enhancers: string[];
    inhibitors: string[];
  };
  half_life: {
    hours: string;
    notes: string;
  };
  timing_recommendations: {
    preferred_windows: string[];
    avoid_windows: string[];
    with_food: boolean;
    food_interactions: string;
    notes: string;
  };
  cycling_recommendations: {
    suggested: boolean;
    typical_pattern: { on_weeks: number; off_weeks: number } | null;
    rationale: string;
  };
  known_interactions: {
    substance: string;
    type: "contraindication" | "caution";
    severity: "critical" | "major" | "moderate" | "minor";
    description: string;
  }[];
  synergies: {
    substance: string;
    benefit: string;
    mechanism: string;
  }[];
  contraindications: string[];
  side_effects: string[];
  safety_notes: string;
  evidence_quality: "strong" | "moderate" | "limited" | "emerging";
  sources_summary: string;
}
