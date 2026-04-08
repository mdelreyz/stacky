import type { UserTherapy } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const userTherapies = {
  list: (activeOnly = true) => {
    const qs = activeOnly ? "?active_only=true" : "";
    return request<PaginatedResponse<UserTherapy>>(`/api/v1/users/me/therapies${qs}`);
  },

  get: (id: string) => request<UserTherapy>(`/api/v1/users/me/therapies/${id}`),

  add: (data: {
    therapy_id: string;
    duration_minutes?: number;
    frequency?: string;
    take_window?: string;
    settings?: Record<string, unknown>;
    notes?: string;
    started_at: string;
  }) =>
    request<UserTherapy>("/api/v1/users/me/therapies", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    request<UserTherapy>(`/api/v1/users/me/therapies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/therapies/${id}`, { method: "DELETE" }),
};
