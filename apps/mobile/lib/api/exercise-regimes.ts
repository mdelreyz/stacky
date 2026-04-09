import type {
  ExerciseRegime,
  ExerciseRegimeCreate,
  ExerciseRegimeUpdate,
  RegimeEntryInput,
  WorkoutRoutine,
} from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const exerciseRegimes = {
  list: (params?: { active_only?: boolean; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.active_only) query.set("active_only", "true");
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return request<PaginatedResponse<ExerciseRegime>>(
      `/api/v1/users/me/exercise-regimes${qs ? `?${qs}` : ""}`,
    );
  },

  get: (id: string) =>
    request<ExerciseRegime>(`/api/v1/users/me/exercise-regimes/${id}`),

  create: (data: ExerciseRegimeCreate) =>
    request<ExerciseRegime>("/api/v1/users/me/exercise-regimes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ExerciseRegimeUpdate) =>
    request<ExerciseRegime>(`/api/v1/users/me/exercise-regimes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/v1/users/me/exercise-regimes/${id}`, { method: "DELETE" }),

  replaceSchedule: (id: string, schedule: RegimeEntryInput[]) =>
    request<ExerciseRegime>(`/api/v1/users/me/exercise-regimes/${id}/schedule`, {
      method: "PUT",
      body: JSON.stringify(schedule),
    }),

  today: (date?: string) => {
    const qs = date ? `?target_date=${date}` : "";
    return request<WorkoutRoutine[]>(`/api/v1/users/me/exercise-regimes/today${qs}`);
  },
};
