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
};
