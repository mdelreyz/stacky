import type {
  NotificationDelivery,
  NotificationPreferences,
  NotificationPreferencesUpdate,
  PushToken,
  PushTokenCreate,
  ReminderSchedule,
} from "@protocols/domain";

import { request } from "./core";

export const notifications = {
  getPreferences: () =>
    request<NotificationPreferences>("/api/v1/users/me/notifications/preferences"),

  updatePreferences: (data: NotificationPreferencesUpdate) =>
    request<NotificationPreferences>("/api/v1/users/me/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  listPushTokens: () =>
    request<PushToken[]>("/api/v1/users/me/notifications/push-tokens"),

  registerPushToken: (data: PushTokenCreate) =>
    request<PushToken>("/api/v1/users/me/notifications/push-tokens", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removePushToken: (token: string) =>
    request<void>(`/api/v1/users/me/notifications/push-tokens/${encodeURIComponent(token)}`, {
      method: "DELETE",
    }),

  getReminderSchedule: (date?: string) => {
    const params = date ? `?target_date=${date}` : "";
    return request<ReminderSchedule>(`/api/v1/users/me/notifications/reminders${params}`);
  },

  sendTestPush: (date?: string) => {
    const params = date ? `?target_date=${date}` : "";
    return request<NotificationDelivery>(`/api/v1/users/me/notifications/test-push${params}`, {
      method: "POST",
    });
  },
};
