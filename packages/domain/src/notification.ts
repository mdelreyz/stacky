export interface NotificationPreferences {
  id: string;
  enabled: boolean;
  window_times: Record<string, string> | null;
  enabled_windows: string[] | null;
  quiet_start: string | null;
  quiet_end: string | null;
  advance_minutes: number | null;
  snooze_minutes: number | null;
  streak_reminders: boolean;
  refill_reminders: boolean;
  interaction_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesUpdate {
  enabled?: boolean;
  window_times?: Record<string, string>;
  enabled_windows?: string[];
  quiet_start?: string | null;
  quiet_end?: string | null;
  advance_minutes?: number;
  snooze_minutes?: number;
  streak_reminders?: boolean;
  refill_reminders?: boolean;
  interaction_alerts?: boolean;
}

export interface PushToken {
  id: string;
  token: string;
  device_id: string | null;
  platform: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PushTokenCreate {
  token: string;
  device_id?: string;
  platform?: "ios" | "android" | "web";
}

export interface ReminderScheduleItem {
  window: string;
  scheduled_time: string;
  items_count: number;
  item_names: string[];
}

export interface ReminderSchedule {
  date: string;
  reminders: ReminderScheduleItem[];
  quiet_start: string | null;
  quiet_end: string | null;
}

export interface NotificationDelivery {
  status: "sent" | "skipped";
  target_date: string;
  reminder_count: number;
  active_tokens: number;
  sent_count: number;
  title: string | null;
  body: string | null;
  message: string;
}
