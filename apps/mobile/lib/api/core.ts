const _PORT_RANGE_START = 8000;
const _PORT_RANGE_END = 8010;

function getDefaultApiUrl() {
  if (typeof window !== "undefined" && window.location) {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const host = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
    return `${protocol}//${host}:${_PORT_RANGE_START}`;
  }

  return `http://127.0.0.1:${_PORT_RANGE_START}`;
}

let API_URL = (process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl()).replace(/\/$/, "");
let _portDiscovered = !!process.env.EXPO_PUBLIC_API_URL;

async function _probePort(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data?.app === "protocols";
  } catch {
    return false;
  }
}

async function _discoverApiPort(): Promise<void> {
  if (_portDiscovered) return;

  // First check the current URL
  if (await _probePort(API_URL)) {
    _portDiscovered = true;
    return;
  }

  // Probe the port range for the Protocols API
  const protocol = API_URL.replace(/(:\d+)$/, "").replace(/\/+$/, "");
  // protocol is e.g. "http://127.0.0.1"
  const baseHost = protocol.replace(/:\d+$/, "");

  for (let port = _PORT_RANGE_START; port < _PORT_RANGE_END; port++) {
    const candidate = `${baseHost}:${port}`;
    if (candidate === API_URL) continue; // already tried
    if (await _probePort(candidate)) {
      API_URL = candidate;
      _portDiscovered = true;
      return;
    }
  }
}

let token: string | null = null;

function formatErrorDetail(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string" && item.trim()) {
          return item;
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as { loc?: unknown; msg?: unknown; detail?: unknown; message?: unknown };
        const path = Array.isArray(record.loc)
          ? record.loc
              .filter((part) => typeof part === "string" && part !== "body")
              .join(".")
          : "";
        const message =
          typeof record.msg === "string"
            ? record.msg
            : typeof record.message === "string"
              ? record.message
              : typeof record.detail === "string"
                ? record.detail
                : "";

        if (!message) {
          return null;
        }

        return path ? `${path}: ${message}` : message;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  if (detail && typeof detail === "object") {
    const record = detail as { message?: unknown; detail?: unknown };
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail;
    }
  }

  return null;
}

function formatErrorPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Request failed";
  }

  const record = payload as { detail?: unknown; message?: unknown; error?: unknown };
  return (
    formatErrorDetail(record.detail) ||
    formatErrorDetail(record.message) ||
    formatErrorDetail(record.error) ||
    "Request failed"
  );
}

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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    // Port may have changed — try discovering the correct one
    if (!_portDiscovered) {
      await _discoverApiPort();
      try {
        response = await fetch(`${API_URL}${path}`, { ...options, headers });
      } catch {
        throw new APIError(
          0,
          `Could not reach the API at ${API_URL}. Check that the backend is running.`
        );
      }
    } else {
      throw new APIError(
        0,
        `Could not reach the API at ${API_URL}. Check that the backend is running.`
      );
    }
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new APIError(response.status, formatErrorPayload(error));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
