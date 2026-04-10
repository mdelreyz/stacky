import type { Supplement } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const supplements = {
  list: (params?: { search?: string; category?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return request<PaginatedResponse<Supplement>>(`/api/v1/supplements${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => request<Supplement>(`/api/v1/supplements/${id}`),

  delete: (id: string) =>
    request<void>(`/api/v1/supplements/${id}`, {
      method: "DELETE",
    }),

  onboard: (data: { name: string; category?: string; form?: string }) =>
    request<{
      id: string;
      name: string;
      status: "ready" | "generating" | "failed";
      ai_profile: Record<string, unknown> | null;
      ai_error: string | null;
    }>("/api/v1/supplements/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
