import type {
  WorkoutSession,
  WorkoutSessionCreate,
  WorkoutSessionListItem,
  WorkoutSessionUpdate,
  WorkoutSet,
  WorkoutSetInput,
  WorkoutSetUpdate,
} from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const workoutSessions = {
  list: (params?: { date_from?: string; date_to?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.set("date_from", params.date_from);
    if (params?.date_to) query.set("date_to", params.date_to);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return request<PaginatedResponse<WorkoutSessionListItem>>(
      `/api/v1/users/me/sessions${qs ? `?${qs}` : ""}`,
    );
  },

  get: (id: string) => request<WorkoutSession>(`/api/v1/users/me/sessions/${id}`),

  start: (data: WorkoutSessionCreate) =>
    request<WorkoutSession>("/api/v1/users/me/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: WorkoutSessionUpdate) =>
    request<WorkoutSession>(`/api/v1/users/me/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/v1/users/me/sessions/${id}`, { method: "DELETE" }),

  addExercise: (sessionId: string, data: { exercise_id: string; sort_order?: number; notes?: string }) =>
    request<WorkoutSession>(`/api/v1/users/me/sessions/${sessionId}/exercises`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logSet: (sessionId: string, exerciseId: string, data: WorkoutSetInput) =>
    request<WorkoutSet>(
      `/api/v1/users/me/sessions/${sessionId}/exercises/${exerciseId}/sets`,
      { method: "POST", body: JSON.stringify(data) },
    ),

  updateSet: (sessionId: string, setId: string, data: WorkoutSetUpdate) =>
    request<WorkoutSet>(`/api/v1/users/me/sessions/${sessionId}/sets/${setId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSet: (sessionId: string, setId: string) =>
    request<void>(`/api/v1/users/me/sessions/${sessionId}/sets/${setId}`, {
      method: "DELETE",
    }),
};
