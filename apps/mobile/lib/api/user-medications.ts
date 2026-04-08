import type { UserMedication } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const userMedications = {
  list: (activeOnly = true) => {
    const qs = activeOnly ? "?active_only=true" : "";
    return request<PaginatedResponse<UserMedication>>(`/api/v1/users/me/medications${qs}`);
  },

  get: (id: string) => request<UserMedication>(`/api/v1/users/me/medications/${id}`),

  add: (data: {
    medication_id: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency?: string;
    take_window?: string;
    with_food?: boolean;
    notes?: string;
    started_at: string;
  }) =>
    request<UserMedication>("/api/v1/users/me/medications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    request<UserMedication>(`/api/v1/users/me/medications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/medications/${id}`, { method: "DELETE" }),
};
