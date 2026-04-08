const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

let token: string | null = null;

export function setToken(nextToken: string | null) {
  token = nextToken;
}

export function getToken(): string | null {
  return token;
}

export class APIError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  has_more: boolean;
  page?: number;
  page_size?: number;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new APIError(response.status, error.detail || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
