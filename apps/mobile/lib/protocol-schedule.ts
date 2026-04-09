import type { Protocol, ProtocolSchedule, ProtocolScheduleType } from "@protocols/domain";

export const PROTOCOL_SCHEDULE_TYPE_OPTIONS = [
  { value: "none", label: "Passive" },
  { value: "manual", label: "Manual" },
  { value: "date_range", label: "Date Range" },
  { value: "week_of_month", label: "Week of Month" },
] as const;

export const PROTOCOL_WEEK_OPTIONS = [1, 2, 3, 4, 5] as const;

export interface ProtocolScheduleFormState {
  type: ProtocolScheduleType | "none";
  manualIsActive: boolean;
  startDate: string;
  endDate: string;
  weeksOfMonth: number[];
}

export interface ProtocolFormState {
  name: string;
  description: string;
  selectedUserSupplementIds: string[];
  selectedUserMedicationIds: string[];
  selectedUserTherapyIds: string[];
  selectedUserPeptideIds: string[];
  schedule: ProtocolScheduleFormState;
}

export function createDefaultProtocolScheduleFormState(): ProtocolScheduleFormState {
  return {
    type: "none",
    manualIsActive: true,
    startDate: "",
    endDate: "",
    weeksOfMonth: [],
  };
}

export function createDefaultProtocolFormState(): ProtocolFormState {
  return {
    name: "",
    description: "",
    selectedUserSupplementIds: [],
    selectedUserMedicationIds: [],
    selectedUserTherapyIds: [],
    selectedUserPeptideIds: [],
    schedule: createDefaultProtocolScheduleFormState(),
  };
}

export function protocolScheduleFromProtocol(protocol: Protocol): ProtocolScheduleFormState {
  if (!protocol.schedule) {
    return createDefaultProtocolScheduleFormState();
  }

  return {
    type: protocol.schedule.type,
    manualIsActive: protocol.schedule.manual_is_active ?? true,
    startDate: protocol.schedule.start_date ?? "",
    endDate: protocol.schedule.end_date ?? "",
    weeksOfMonth: protocol.schedule.weeks_of_month ?? [],
  };
}

export function buildProtocolSchedule(schedule: ProtocolScheduleFormState): ProtocolSchedule | null {
  if (schedule.type === "none") {
    return null;
  }

  if (schedule.type === "manual") {
    return {
      type: "manual",
      manual_is_active: schedule.manualIsActive,
      start_date: null,
      end_date: null,
      weeks_of_month: null,
    };
  }

  if (schedule.type === "date_range") {
    return {
      type: "date_range",
      manual_is_active: null,
      start_date: schedule.startDate.trim() || null,
      end_date: schedule.endDate.trim() || null,
      weeks_of_month: null,
    };
  }

  return {
    type: "week_of_month",
    manual_is_active: null,
    start_date: null,
    end_date: null,
    weeks_of_month: [...schedule.weeksOfMonth].sort((a, b) => a - b),
  };
}

export function getProtocolScheduleValidationError(schedule: ProtocolScheduleFormState): string | null {
  if (schedule.type === "date_range") {
    if (!schedule.startDate.trim() || !schedule.endDate.trim()) {
      return "Enter both start and end dates for the scheduled regime.";
    }
    if (schedule.startDate > schedule.endDate) {
      return "The schedule start date must be on or before the end date.";
    }
  }

  if (schedule.type === "week_of_month" && schedule.weeksOfMonth.length === 0) {
    return "Select at least one week of the month for this regime.";
  }

  return null;
}
