import { request } from "./core";

export const auth = {
  signup: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) =>
    request<{
      access_token: string;
      user: { id: string; first_name: string; last_name: string; email: string };
    }>("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<{
      access_token: string;
      user: { id: string; first_name: string; last_name: string; email: string };
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      timezone: string;
      created_at: string;
    }>("/api/v1/auth/me"),
};
