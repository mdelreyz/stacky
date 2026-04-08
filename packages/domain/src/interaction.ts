export type InteractionType = "contraindication" | "caution" | "synergy" | "neutral";
export type Severity = "critical" | "major" | "moderate" | "minor";

export interface Interaction {
  id: string;
  supplement_a_id: string;
  supplement_b_id: string;
  supplement_a_name: string;
  supplement_b_name: string;
  interaction_type: InteractionType;
  severity: Severity;
  description: string;
  mechanism: string | null;
  source: string;
  ai_confidence: number | null;
}
