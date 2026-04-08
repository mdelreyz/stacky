const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

let _token: string | null = null;

export function setToken(token: string | null) {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

export class APIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (_token) {
    headers["Authorization"] = `Bearer ${_token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new APIError(response.status, error.detail || "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// Auth
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

// Supplements catalog
export const supplements = {
  list: (params?: { search?: string; category?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return request<{
      items: Supplement[];
      total: number;
      page: number;
      has_more: boolean;
    }>(`/api/v1/supplements${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => request<Supplement>(`/api/v1/supplements/${id}`),

  onboard: (data: { name: string; category?: string; form?: string }) =>
    request<{
      id: string;
      name: string;
      status: string;
      ai_profile: Record<string, unknown> | null;
    }>("/api/v1/supplements/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// User supplements
export const userSupplements = {
  list: (activeOnly = true) => {
    const qs = activeOnly ? "?active_only=true" : "";
    return request<{
      items: UserSupplement[];
      total: number;
      has_more: boolean;
    }>(`/api/v1/users/me/supplements${qs}`);
  },

  add: (data: {
    supplement_id: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency?: string;
    take_window?: string;
    with_food?: boolean;
    notes?: string;
    started_at: string;
  }) =>
    request<UserSupplement>("/api/v1/users/me/supplements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    request<UserSupplement>(`/api/v1/users/me/supplements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/supplements/${id}`, { method: "DELETE" }),
};

// Types
export interface Supplement {
  id: string;
  name: string;
  category: string;
  form: string | null;
  description: string | null;
  ai_profile: Record<string, unknown> | null;
  ai_generated_at: string | null;
  is_verified: boolean;
}

export interface UserSupplement {
  id: string;
  supplement: Supplement;
  dosage_amount: number;
  dosage_unit: string;
  frequency: string;
  take_window: string;
  with_food: boolean;
  notes: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}
