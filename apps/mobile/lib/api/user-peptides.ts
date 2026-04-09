import type { UserPeptide } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const userPeptides = {
  list: (activeOnly = true) => {
    const qs = activeOnly ? "?active_only=true" : "";
    return request<PaginatedResponse<UserPeptide>>(`/api/v1/users/me/peptides${qs}`);
  },

  get: (id: string) => request<UserPeptide>(`/api/v1/users/me/peptides/${id}`),

  add: (data: {
    peptide_id: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency?: string;
    take_window?: string;
    with_food?: boolean;
    route?: string;
    reconstitution?: Record<string, unknown>;
    storage_notes?: string;
    notes?: string;
    started_at: string;
  }) =>
    request<UserPeptide>("/api/v1/users/me/peptides", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    request<UserPeptide>(`/api/v1/users/me/peptides/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/peptides/${id}`, { method: "DELETE" }),
};
