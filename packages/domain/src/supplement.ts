export type SupplementCategory =
  | "vitamin"
  | "mineral"
  | "herb"
  | "amino_acid"
  | "nootropic"
  | "hormone"
  | "probiotic"
  | "enzyme"
  | "fatty_acid"
  | "antioxidant"
  | "adaptogen"
  | "peptide"
  | "other";

export interface Supplement {
  id: string;
  name: string;
  category: SupplementCategory;
  form: string | null;
  description: string | null;
  ai_profile: SupplementAIProfile | null;
  ai_generated_at: string | null;
  is_verified: boolean;
}

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
