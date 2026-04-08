export type MedicationCategory =
  | "prescription"
  | "otc"
  | "topical"
  | "injectable"
  | "other";

export interface MedicationAIProfile {
  common_names?: string[];
  typical_dosages?: {
    amount: number;
    unit: string;
    frequency: string;
    context: string;
  }[];
  timing_recommendations?: {
    preferred_windows?: string[];
    with_food?: boolean;
    notes?: string;
  };
  known_interactions?: {
    substance: string;
    type: "contraindication" | "caution";
    severity: "critical" | "major" | "moderate" | "minor";
    description: string;
  }[];
  monitoring_notes?: string;
  safety_notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  category: MedicationCategory;
  form: string | null;
  description: string | null;
  ai_profile: MedicationAIProfile | null;
  ai_generated_at: string | null;
  is_verified: boolean;
}
