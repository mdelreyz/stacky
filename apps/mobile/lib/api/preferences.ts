import type {
  RecommendationResponse,
  ApplyRecommendationsResponse,
  InteractionCheckResponse,
  StackScoreResponse,
  UserPreferences,
  UserPreferencesUpdate,
  WizardResponse,
  WizardTurn,
} from "@protocols/domain";

import { request } from "./core";

export const preferences = {
  get: () => request<UserPreferences>("/api/v1/users/me/preferences"),

  update: (data: UserPreferencesUpdate) =>
    request<UserPreferences>("/api/v1/users/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  upsert: (data: UserPreferencesUpdate) =>
    request<UserPreferences>("/api/v1/users/me/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getRecommendations: (data: {
    count?: number;
    item_types?: string[];
    goals?: string[];
  }) =>
    request<RecommendationResponse>("/api/v1/users/me/preferences/recommendations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  applyRecommendations: (data: {
    items: Array<{
      catalog_id: string;
      item_type: string;
      dosage_amount?: number;
      dosage_unit?: string;
      frequency?: string;
      take_window?: string;
    }>;
    protocol_name?: string;
  }) =>
    request<ApplyRecommendationsResponse>("/api/v1/users/me/preferences/recommendations/apply", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  checkInteractions: () =>
    request<InteractionCheckResponse>("/api/v1/users/me/preferences/interactions"),

  getStackScore: () =>
    request<StackScoreResponse>("/api/v1/users/me/preferences/stack-score"),

  wizardTurn: (data: { message: string; conversation: WizardTurn[] }) =>
    request<WizardResponse>("/api/v1/users/me/preferences/wizard", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
