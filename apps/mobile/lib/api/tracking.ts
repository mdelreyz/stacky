import type { TrackingOverview } from "@protocols/domain";

import { request } from "./core";

export const tracking = {
  overview: (params?: { days?: number; endDate?: string; itemType?: "supplement" | "medication" | "therapy" | "peptide" }) => {
    const query = new URLSearchParams();
    if (params?.days) query.set("days", String(params.days));
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.itemType) query.set("item_type", params.itemType);
    const qs = query.toString();
    return request<TrackingOverview>(`/api/v1/users/me/tracking/overview${qs ? `?${qs}` : ""}`);
  },
};
