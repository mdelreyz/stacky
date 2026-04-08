import type { AuthResponse, User } from "@protocols/domain";

import { request } from "./core";

export const auth = {
  signup: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) =>
    request<AuthResponse>("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/api/v1/auth/me"),

  updateMe: (data: {
    first_name?: string;
    last_name?: string;
    timezone?: string;
    location_name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) =>
    request<User>("/api/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
