import type { Protocol } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const protocols = {
  list: (activeOnly = true) => {
    const qs = activeOnly ? "?active_only=true" : "";
    return request<PaginatedResponse<Protocol>>(`/api/v1/users/me/protocols${qs}`);
  },

  get: (id: string) => request<Protocol>(`/api/v1/users/me/protocols/${id}`),

  create: (data: {
    name: string;
    description?: string;
    user_supplement_ids: string[];
    user_therapy_ids?: string[];
  }) =>
    request<Protocol>("/api/v1/users/me/protocols", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      is_active?: boolean;
      user_supplement_ids?: string[];
      user_therapy_ids?: string[];
    }
  ) =>
    request<Protocol>(`/api/v1/users/me/protocols/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/protocols/${id}`, { method: "DELETE" }),
};
