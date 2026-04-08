import type { SupplementRefillRequest, UserSupplement } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const userSupplements = {
  list: (activeOnly = true) => {
    const qs = activeOnly ? "?active_only=true" : "";
    return request<PaginatedResponse<UserSupplement>>(`/api/v1/users/me/supplements${qs}`);
  },

  get: (id: string) => request<UserSupplement>(`/api/v1/users/me/supplements/${id}`),

  add: (data: {
    supplement_id: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency?: string;
    take_window?: string;
    with_food?: boolean;
    notes?: string;
    started_at: string;
  }) =>
    request<UserSupplement>("/api/v1/users/me/supplements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    request<UserSupplement>(`/api/v1/users/me/supplements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getRefillRequest: () =>
    request<SupplementRefillRequest>("/api/v1/users/me/supplements/refill-request"),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/supplements/${id}`, { method: "DELETE" }),
};
