import type {
  AdherenceResult,
  AIProfileStatus,
  AuthResponse,
  DailyPlan,
  Medication,
  Protocol,
  Supplement,
  SupplementAIProfile,
  Therapy,
  User,
  UserMedication,
  UserSupplement,
  UserTherapy,
} from "@protocols/domain";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export class ProtocolsAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new APIError(response.status, error.detail || "Request failed");
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async signup(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.token = result.access_token;
    return result;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.token = result.access_token;
    return result;
  }

  async getMe(): Promise<User> {
    return this.request<User>("/api/v1/auth/me");
  }

  async getDailyPlan(date?: string): Promise<DailyPlan> {
    const query = new URLSearchParams();
    if (date) query.set("date", date);
    const qs = query.toString();
    return this.request(`/api/v1/users/me/daily-plan${qs ? `?${qs}` : ""}`);
  }

  async updateSupplementAdherence(
    itemId: string,
    data: {
      status: "taken" | "skipped";
      date?: string;
      skip_reason?: string;
    }
  ): Promise<AdherenceResult> {
    return this.request(`/api/v1/users/me/adherence/supplements/${itemId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTherapyAdherence(
    itemId: string,
    data: {
      status: "taken" | "skipped";
      date?: string;
      skip_reason?: string;
    }
  ): Promise<AdherenceResult> {
    return this.request(`/api/v1/users/me/adherence/therapies/${itemId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMedicationAdherence(
    itemId: string,
    data: {
      status: "taken" | "skipped";
      date?: string;
      skip_reason?: string;
    }
  ): Promise<AdherenceResult> {
    return this.request(`/api/v1/users/me/adherence/medications/${itemId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listProtocols(params?: {
    page?: number;
    active_only?: boolean;
  }): Promise<PaginatedResponse<Protocol>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
    const qs = query.toString();
    return this.request(`/api/v1/users/me/protocols${qs ? `?${qs}` : ""}`);
  }

  async getProtocol(id: string): Promise<Protocol> {
    return this.request(`/api/v1/users/me/protocols/${id}`);
  }

  async createProtocol(data: {
    name: string;
    description?: string | null;
    user_supplement_ids: string[];
    user_medication_ids?: string[];
    user_therapy_ids?: string[];
  }): Promise<Protocol> {
    return this.request("/api/v1/users/me/protocols", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProtocol(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      is_active?: boolean;
      user_supplement_ids?: string[];
      user_medication_ids?: string[];
      user_therapy_ids?: string[];
    }
  ): Promise<Protocol> {
    return this.request(`/api/v1/users/me/protocols/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async removeProtocol(id: string): Promise<void> {
    return this.request(`/api/v1/users/me/protocols/${id}`, {
      method: "DELETE",
    });
  }

  // Supplements catalog
  async listSupplements(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Supplement>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    const qs = query.toString();
    return this.request(`/api/v1/supplements${qs ? `?${qs}` : ""}`);
  }

  async getSupplement(id: string): Promise<Supplement> {
    return this.request(`/api/v1/supplements/${id}`);
  }

  async listTherapies(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Therapy>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    const qs = query.toString();
    return this.request(`/api/v1/therapies${qs ? `?${qs}` : ""}`);
  }

  async getTherapy(id: string): Promise<Therapy> {
    return this.request(`/api/v1/therapies/${id}`);
  }

  async listMedications(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Medication>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    const qs = query.toString();
    return this.request(`/api/v1/medications${qs ? `?${qs}` : ""}`);
  }

  async getMedication(id: string): Promise<Medication> {
    return this.request(`/api/v1/medications/${id}`);
  }

  async onboardSupplement(data: {
    name: string;
    category?: string;
    form?: string;
  }): Promise<{
    id: string;
    name: string;
    status: AIProfileStatus;
    ai_profile: SupplementAIProfile | null;
    ai_error: string | null;
  }> {
    return this.request("/api/v1/supplements/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // User supplements
  async listUserSupplements(params?: {
    page?: number;
    active_only?: boolean;
  }): Promise<PaginatedResponse<UserSupplement>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
    const qs = query.toString();
    return this.request(`/api/v1/users/me/supplements${qs ? `?${qs}` : ""}`);
  }

  async addUserSupplement(data: {
    supplement_id: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency?: string;
    take_window?: string;
    with_food?: boolean;
    notes?: string;
    started_at: string;
  }): Promise<UserSupplement> {
    return this.request("/api/v1/users/me/supplements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUserSupplement(id: string): Promise<UserSupplement> {
    return this.request(`/api/v1/users/me/supplements/${id}`);
  }

  async updateUserSupplement(
    id: string,
    data: Record<string, unknown>
  ): Promise<UserSupplement> {
    return this.request(`/api/v1/users/me/supplements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async removeUserSupplement(id: string): Promise<void> {
    return this.request(`/api/v1/users/me/supplements/${id}`, {
      method: "DELETE",
    });
  }

  async listUserTherapies(params?: {
    page?: number;
    active_only?: boolean;
  }): Promise<PaginatedResponse<UserTherapy>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
    const qs = query.toString();
    return this.request(`/api/v1/users/me/therapies${qs ? `?${qs}` : ""}`);
  }

  async addUserTherapy(data: {
    therapy_id: string;
    duration_minutes?: number;
    frequency?: string;
    take_window?: string;
    settings?: Record<string, unknown>;
    notes?: string;
    started_at: string;
  }): Promise<UserTherapy> {
    return this.request("/api/v1/users/me/therapies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUserTherapy(id: string): Promise<UserTherapy> {
    return this.request(`/api/v1/users/me/therapies/${id}`);
  }

  async updateUserTherapy(
    id: string,
    data: Record<string, unknown>
  ): Promise<UserTherapy> {
    return this.request(`/api/v1/users/me/therapies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async removeUserTherapy(id: string): Promise<void> {
    return this.request(`/api/v1/users/me/therapies/${id}`, {
      method: "DELETE",
    });
  }

  async listUserMedications(params?: {
    page?: number;
    active_only?: boolean;
  }): Promise<PaginatedResponse<UserMedication>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
    const qs = query.toString();
    return this.request(`/api/v1/users/me/medications${qs ? `?${qs}` : ""}`);
  }

  async addUserMedication(data: {
    medication_id: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency?: string;
    take_window?: string;
    with_food?: boolean;
    notes?: string;
    started_at: string;
  }): Promise<UserMedication> {
    return this.request("/api/v1/users/me/medications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUserMedication(id: string): Promise<UserMedication> {
    return this.request(`/api/v1/users/me/medications/${id}`);
  }

  async updateUserMedication(
    id: string,
    data: Record<string, unknown>
  ): Promise<UserMedication> {
    return this.request(`/api/v1/users/me/medications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async removeUserMedication(id: string): Promise<void> {
    return this.request(`/api/v1/users/me/medications/${id}`, {
      method: "DELETE",
    });
  }
}

export class APIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}
