export type TherapyCategory =
  | "thermal"
  | "light"
  | "movement"
  | "breathwork"
  | "electrical"
  | "manual"
  | "sound"
  | "other";

export interface Therapy {
  id: string;
  name: string;
  category: TherapyCategory;
  description: string | null;
  ai_profile: Record<string, unknown> | null;
  ai_generated_at: string | null;
}
