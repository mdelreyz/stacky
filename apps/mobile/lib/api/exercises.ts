import type { Exercise, ExerciseCreate, ExerciseUpdate } from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const exercises = {
  list: (params?: {
    search?: string;
    category?: string;
    muscle?: string;
    equipment?: string;
    mine_only?: boolean;
    page?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.muscle) query.set("muscle", params.muscle);
    if (params?.equipment) query.set("equipment", params.equipment);
    if (params?.mine_only) query.set("mine_only", "true");
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return request<PaginatedResponse<Exercise>>(`/api/v1/exercises${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => request<Exercise>(`/api/v1/exercises/${id}`),

  create: (data: ExerciseCreate) =>
    request<Exercise>("/api/v1/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ExerciseUpdate) =>
    request<Exercise>(`/api/v1/exercises/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/v1/exercises/${id}`, { method: "DELETE" }),
};
