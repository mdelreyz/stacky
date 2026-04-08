import type { DailyPlan, SupplementAdherenceResult } from "@protocols/domain";

import { request } from "./core";

export const dailyPlan = {
  get: (date?: string) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : "";
    return request<DailyPlan>(`/api/v1/users/me/daily-plan${qs}`);
  },

  updateSupplementAdherence: (
    itemId: string,
    data: { status: "taken" | "skipped"; date?: string; skip_reason?: string }
  ) =>
    request<SupplementAdherenceResult>(`/api/v1/users/me/adherence/supplements/${itemId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
