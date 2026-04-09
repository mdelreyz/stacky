import type {
  GymLocation,
  GymLocationCreate,
  GymLocationMatch,
  GymLocationUpdate,
} from "@protocols/domain";

import { request } from "./core";

export const gymLocations = {
  list: () => request<GymLocation[]>("/api/v1/users/me/gym-locations"),

  create: (data: GymLocationCreate) =>
    request<GymLocation>("/api/v1/users/me/gym-locations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: GymLocationUpdate) =>
    request<GymLocation>(`/api/v1/users/me/gym-locations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/v1/users/me/gym-locations/${id}`, { method: "DELETE" }),

  match: (latitude: number, longitude: number) =>
    request<GymLocationMatch>("/api/v1/users/me/gym-locations/match", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }),
};
