import type { Medication } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const medications = {
  list: (params?: { search?: string; category?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return request<PaginatedResponse<Medication>>(`/api/v1/medications${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => request<Medication>(`/api/v1/medications/${id}`),

  onboard: (data: { name: string; category?: string; form?: string }) =>
    request<{
      id: string;
      name: string;
      status: "ready" | "generating" | "failed";
      ai_profile: Record<string, unknown> | null;
      ai_error: string | null;
    }>("/api/v1/medications/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
