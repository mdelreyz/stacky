import type { TrackingOverview } from "@protocols/domain";

import { request } from "./core";

export const tracking = {
  overview: (params?: { days?: number; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.days) query.set("days", String(params.days));
    if (params?.endDate) query.set("end_date", params.endDate);
    const qs = query.toString();
    return request<TrackingOverview>(`/api/v1/users/me/tracking/overview${qs ? `?${qs}` : ""}`);
  },
};
