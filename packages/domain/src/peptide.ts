export type PeptideCategory =
  | "research"
  | "therapeutic"
  | "cosmetic"
  | "performance"
  | "recovery"
  | "other";

export interface Peptide {
  id: string;
  name: string;
  category: PeptideCategory;
  form: string | null;
  description: string | null;
  goals: string[] | null;
  mechanism_tags: string[] | null;
  ai_profile: Record<string, unknown> | null;
  ai_generated_at: string | null;
  is_verified: boolean;
}
