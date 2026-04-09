import type {
  RoutineExerciseInput,
  WorkoutRoutine,
  WorkoutRoutineCreate,
  WorkoutRoutineListItem,
  WorkoutRoutineUpdate,
} from "@protocols/domain";

import { request, type PaginatedResponse } from "./core";

export const workoutRoutines = {
  list: (params?: { active_only?: boolean; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.active_only) query.set("active_only", "true");
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return request<PaginatedResponse<WorkoutRoutineListItem>>(
      `/api/v1/users/me/routines${qs ? `?${qs}` : ""}`,
    );
  },

  get: (id: string) => request<WorkoutRoutine>(`/api/v1/users/me/routines/${id}`),

  create: (data: WorkoutRoutineCreate) =>
    request<WorkoutRoutine>("/api/v1/users/me/routines", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: WorkoutRoutineUpdate) =>
    request<WorkoutRoutine>(`/api/v1/users/me/routines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/v1/users/me/routines/${id}`, { method: "DELETE" }),

  replaceExercises: (id: string, exercises: RoutineExerciseInput[]) =>
    request<WorkoutRoutine>(`/api/v1/users/me/routines/${id}/exercises`, {
      method: "PUT",
      body: JSON.stringify(exercises),
    }),
};
