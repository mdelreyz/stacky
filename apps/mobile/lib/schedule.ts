import {
  FREQUENCY_VALUES,
  TAKE_WINDOW_VALUES,
  isFrequency,
  isTakeWindow,
  type Frequency,
  type TakeWindow,
} from "@protocols/domain";

export const FREQUENCY_OPTIONS: ReadonlyArray<{ value: Frequency; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "three_times_daily", label: "3x Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "every_other_day", label: "Every Other Day" },
  { value: "as_needed", label: "As Needed" },
];

export const TAKE_WINDOW_OPTIONS: ReadonlyArray<{ value: TakeWindow; label: string }> = [
  { value: "morning_fasted", label: "Morning Fasted" },
  { value: "morning_with_food", label: "Morning With Food" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "bedtime", label: "Bedtime" },
];

export type ScheduleFrequency = Frequency;
export type ScheduleTakeWindow = TakeWindow;

export const AVAILABLE_SCHEDULE_FREQUENCIES = FREQUENCY_VALUES.filter(
  (value) => value !== "as_needed"
) as ScheduleFrequency[];

export const AVAILABLE_SCHEDULE_WINDOWS = [...TAKE_WINDOW_VALUES] as ScheduleTakeWindow[];

export function isScheduleFrequency(value: string): value is ScheduleFrequency {
  return isFrequency(value) && value !== "as_needed";
}

export function isScheduleTakeWindow(value: string): value is ScheduleTakeWindow {
  return isTakeWindow(value);
}
