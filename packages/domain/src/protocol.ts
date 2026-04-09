import type { UserMedication, UserPeptide, UserSupplement, UserTherapy } from "./user-items";

export type ProtocolScheduleType = "manual" | "date_range" | "week_of_month";

export interface ProtocolSchedule {
  type: ProtocolScheduleType;
  manual_is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  weeks_of_month: number[] | null;
}

export interface Protocol {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  schedule: ProtocolSchedule | null;
  schedule_summary: string;
  is_currently_active: boolean;
  items: ProtocolItem[];
  created_at: string;
}

export interface ProtocolItem {
  id: string;
  item_type: "supplement" | "medication" | "therapy" | "peptide";
  user_supplement: UserSupplement | null;
  user_medication: UserMedication | null;
  user_therapy: UserTherapy | null;
  user_peptide: UserPeptide | null;
  sort_order: number;
}
