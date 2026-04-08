import type { UserMedication, UserSupplement, UserTherapy } from "./user-items";

export interface Protocol {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  items: ProtocolItem[];
  created_at: string;
}

export interface ProtocolItem {
  id: string;
  item_type: "supplement" | "medication" | "therapy";
  user_supplement: UserSupplement | null;
  user_medication: UserMedication | null;
  user_therapy: UserTherapy | null;
  sort_order: number;
}
