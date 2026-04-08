import type { NutritionCycle, NutritionPhase } from "@protocols/domain";

import { type PaginatedResponse, request } from "./core";

export const nutrition = {
  list: (params?: { page?: number; page_size?: number; active_only?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
    const qs = query.toString();
    return request<PaginatedResponse<NutritionCycle>>(`/api/v1/users/me/nutrition${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => request<NutritionCycle>(`/api/v1/users/me/nutrition/${id}`),

  create: (data: {
    cycle_type: "macro_profile" | "named_diet" | "elimination" | "custom";
    name: string;
    phase_started_at: string;
    phases: NutritionPhase[];
  }) =>
    request<NutritionCycle>("/api/v1/users/me/nutrition", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: {
      cycle_type?: "macro_profile" | "named_diet" | "elimination" | "custom";
      name?: string;
      phase_started_at?: string;
      phases?: NutritionPhase[];
      is_active?: boolean;
    }
  ) =>
    request<NutritionCycle>(`/api/v1/users/me/nutrition/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/nutrition/${id}`, {
      method: "DELETE",
    }),
};
