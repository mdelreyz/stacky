export interface TemplateItemBlueprint {
  type: string;
  catalog_name: string;
  dosage?: string | null;
  take_window?: string | null;
  frequency?: string | null;
  notes?: string | null;
}

export interface ProtocolTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: string | null;
  icon: string | null;
  is_featured: boolean;
  items: TemplateItemBlueprint[] | null;
  tags: string[] | null;
  adoption_count: number;
  created_at: string;
}

export interface ProtocolTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: string | null;
  icon: string | null;
  is_featured: boolean;
  items_count: number;
  tags: string[] | null;
  adoption_count: number;
}

export interface AdoptTemplateResponse {
  protocol_id: string | null;
  protocol_name: string;
  items_created: number;
  items_existing: number;
  message: string;
}

export type TemplateCategory =
  | "longevity"
  | "sleep"
  | "cognitive"
  | "energy"
  | "immune"
  | "recovery"
  | "hormonal"
  | "skin"
  | "gut"
  | "cardiovascular"
  | "starter";
