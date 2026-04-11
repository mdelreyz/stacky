import type {
  HealthJournalEntry,
  HealthJournalEntryCreate,
  HealthJournalEntryUpdate,
  HealthJournalSummary,
} from "@protocols/domain";

import { request } from "./core";

export const healthJournal = {
  list: (params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.startDate) search.set("start_date", params.startDate);
    if (params?.endDate) search.set("end_date", params.endDate);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.offset) search.set("offset", String(params.offset));
    const qs = search.toString();
    return request<HealthJournalEntry[]>(`/api/v1/users/me/journal${qs ? `?${qs}` : ""}`);
  },

  getByDate: (date: string) =>
    request<HealthJournalEntry>(`/api/v1/users/me/journal/date/${date}`),

  get: (id: string) =>
    request<HealthJournalEntry>(`/api/v1/users/me/journal/${id}`),

  create: (data: HealthJournalEntryCreate) =>
    request<HealthJournalEntry>("/api/v1/users/me/journal", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: HealthJournalEntryUpdate) =>
    request<HealthJournalEntry>(`/api/v1/users/me/journal/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/users/me/journal/${id}`, {
      method: "DELETE",
    }),

  summary: (params?: { startDate?: string; endDate?: string }) => {
    const search = new URLSearchParams();
    if (params?.startDate) search.set("start_date", params.startDate);
    if (params?.endDate) search.set("end_date", params.endDate);
    const qs = search.toString();
    return request<HealthJournalSummary>(`/api/v1/users/me/journal/summary${qs ? `?${qs}` : ""}`);
  },
};
