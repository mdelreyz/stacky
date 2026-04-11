import type { WeeklyDigest } from "@protocols/domain";

import { request } from "./core";

export const weeklyDigest = {
  get: (weekEnd?: string) => {
    const params = weekEnd ? `?week_end=${weekEnd}` : "";
    return request<WeeklyDigest>(`/api/v1/users/me/weekly-digest${params}`);
  },
};
