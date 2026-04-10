import type {
  AdherenceResult,
  AIProfileStatus,
  ApplyRecommendationsResponse,
  AuthResponse,
  BatchAdherenceResponse,
  DailyPlan,
  HealthGoal,
  InteractionCheckResponse,
  Medication,
  StackScoreResponse,
  WizardResponse,
  WizardTurn,
  NutritionCycle,
  NutritionPhase,
  Peptide,
  Protocol,
  ProtocolSchedule,
  RecommendationItemType,
  RecommendationResponse,
  Supplement,
  SupplementRefillRequest,
  SupplementAIProfile,
  Therapy,
  TrackingOverview,
  User,
  UserMedication,
  UserMedicationUpdate,
  UserPeptide,
  UserPeptideUpdate,
  UserPreferences,
  UserSupplement,
  UserSupplementUpdate,
  UserTherapy,
  UserTherapyUpdate,
} from "@protocols/domain";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

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
      throw new APIError(response.status, formatErrorPayload(error));
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

  async updateMe(data: {
    first_name?: string;
    last_name?: string;
    timezone?: string;
    location_name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<User> {
    return this.request<User>("/api/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
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

  async updatePeptideAdherence(
    itemId: string,
    data: {
      status: "taken" | "skipped";
      date?: string;
      skip_reason?: string;
    }
  ): Promise<AdherenceResult> {
    return this.request(`/api/v1/users/me/adherence/peptides/${itemId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async batchProtocolAdherence(
    protocolId: string,
    data: {
      status: "taken" | "skipped";
      date?: string;
      skip_reason?: string;
    }
  ): Promise<BatchAdherenceResponse> {
    return this.request(`/api/v1/users/me/adherence/protocols/${protocolId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listNutrition(params?: {
    page?: number;
    page_size?: number;
    active_only?: boolean;
  }): Promise<PaginatedResponse<NutritionCycle>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
    const qs = query.toString();
    return this.request(`/api/v1/users/me/nutrition${qs ? `?${qs}` : ""}`);
  }

  async getNutrition(id: string): Promise<NutritionCycle> {
    return this.request(`/api/v1/users/me/nutrition/${id}`);
  }

  async createNutrition(data: {
    cycle_type: "macro_profile" | "named_diet" | "elimination" | "custom";
    name: string;
    phase_started_at: string;
    phases: NutritionPhase[];
  }): Promise<NutritionCycle> {
    return this.request("/api/v1/users/me/nutrition", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateNutrition(
    id: string,
    data: {
      cycle_type?: "macro_profile" | "named_diet" | "elimination" | "custom";
      name?: string;
      phase_started_at?: string;
      phases?: NutritionPhase[];
      is_active?: boolean;
    }
  ): Promise<NutritionCycle> {
    return this.request(`/api/v1/users/me/nutrition/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async removeNutrition(id: string): Promise<void> {
    return this.request(`/api/v1/users/me/nutrition/${id}`, {
      method: "DELETE",
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
    schedule?: ProtocolSchedule | null;
    user_supplement_ids: string[];
    user_medication_ids?: string[];
    user_therapy_ids?: string[];
    user_peptide_ids?: string[];
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
      schedule?: ProtocolSchedule | null;
      user_supplement_ids?: string[];
      user_medication_ids?: string[];
      user_therapy_ids?: string[];
      user_peptide_ids?: string[];
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

  async getTrackingOverview(params?: {
    days?: number;
    end_date?: string;
    item_type?: "supplement" | "medication" | "therapy" | "peptide";
  }): Promise<TrackingOverview> {
    const query = new URLSearchParams();
    if (params?.days) query.set("days", String(params.days));
    if (params?.end_date) query.set("end_date", params.end_date);
    if (params?.item_type) query.set("item_type", params.item_type);
    const qs = query.toString();
    return this.request(`/api/v1/users/me/tracking/overview${qs ? `?${qs}` : ""}`);
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

  async getSupplementRefillRequest(): Promise<SupplementRefillRequest> {
    return this.request("/api/v1/users/me/supplements/refill-request");
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

  async onboardMedication(data: {
    name: string;
    category?: string;
    form?: string;
  }): Promise<{
    id: string;
    name: string;
    status: AIProfileStatus;
    ai_profile: Record<string, unknown> | null;
    ai_error: string | null;
  }> {
    return this.request("/api/v1/medications/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    });
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
    data: UserSupplementUpdate
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
    data: UserTherapyUpdate
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
    data: UserMedicationUpdate
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

  // Peptides catalog
  async listPeptides(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Peptide>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    const qs = query.toString();
    return this.request(`/api/v1/peptides${qs ? `?${qs}` : ""}`);
  }

  async getPeptide(id: string): Promise<Peptide> {
    return this.request(`/api/v1/peptides/${id}`);
  }

  // User peptides
  async listUserPeptides(params?: {
    page?: number;
    active_only?: boolean;
  }): Promise<PaginatedResponse<UserPeptide>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
    const qs = query.toString();
    return this.request(`/api/v1/users/me/peptides${qs ? `?${qs}` : ""}`);
  }

  async addUserPeptide(data: {
    peptide_id: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency?: string;
    take_window?: string;
    route?: string;
    reconstitution?: Record<string, unknown>;
    storage_notes?: string;
    notes?: string;
    started_at: string;
  }): Promise<UserPeptide> {
    return this.request("/api/v1/users/me/peptides", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUserPeptide(id: string): Promise<UserPeptide> {
    return this.request(`/api/v1/users/me/peptides/${id}`);
  }

  async updateUserPeptide(
    id: string,
    data: UserPeptideUpdate
  ): Promise<UserPeptide> {
    return this.request(`/api/v1/users/me/peptides/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async removeUserPeptide(id: string): Promise<void> {
    return this.request(`/api/v1/users/me/peptides/${id}`, {
      method: "DELETE",
    });
  }

  // User preferences
  async getPreferences(): Promise<UserPreferences> {
    return this.request("/api/v1/users/me/preferences");
  }

  async upsertPreferences(data: {
    interaction_mode?: string;
    max_supplements_per_day?: number | null;
    max_tablets_per_day?: number | null;
    max_medications?: number | null;
    exercise_blocks_per_week?: number | null;
    exercise_minutes_per_day?: number | null;
    primary_goals?: HealthGoal[] | null;
    focus_concerns?: string[] | null;
    excluded_ingredients?: string[] | null;
    age?: number | null;
    biological_sex?: "male" | "female" | "other" | null;
    notes?: string | null;
  }): Promise<UserPreferences> {
    return this.request("/api/v1/users/me/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updatePreferences(data: {
    interaction_mode?: string;
    max_supplements_per_day?: number | null;
    max_tablets_per_day?: number | null;
    max_medications?: number | null;
    exercise_blocks_per_week?: number | null;
    exercise_minutes_per_day?: number | null;
    primary_goals?: HealthGoal[] | null;
    focus_concerns?: string[] | null;
    excluded_ingredients?: string[] | null;
    age?: number | null;
    biological_sex?: "male" | "female" | "other" | null;
    notes?: string | null;
  }): Promise<UserPreferences> {
    return this.request("/api/v1/users/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // AI Recommendations
  async getRecommendations(data: {
    max_items?: number;
    goals?: HealthGoal[];
    focus_concern?: string;
    item_types?: RecommendationItemType[];
    exclude_current?: boolean;
  }): Promise<RecommendationResponse> {
    return this.request("/api/v1/users/me/preferences/recommendations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async applyRecommendations(data: {
    items: {
      catalog_id: string;
      item_type: RecommendationItemType;
      dosage_amount?: number;
      dosage_unit?: string;
      take_window?: string;
      frequency?: string;
    }[];
    protocol_name?: string;
    started_at?: string;
  }): Promise<ApplyRecommendationsResponse> {
    return this.request("/api/v1/users/me/preferences/recommendations/apply", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async checkInteractions(): Promise<InteractionCheckResponse> {
    return this.request("/api/v1/users/me/preferences/interactions");
  }

  async getStackScore(): Promise<StackScoreResponse> {
    return this.request("/api/v1/users/me/preferences/stack-score");
  }

  async wizardTurn(data: {
    message: string;
    conversation?: WizardTurn[];
  }): Promise<WizardResponse> {
    return this.request("/api/v1/users/me/preferences/wizard", {
      method: "POST",
      body: JSON.stringify({
        message: data.message,
        conversation: data.conversation ?? [],
      }),
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
