import type { GoalProgressResponse } from "@protocols/domain";

import { request } from "./core";

export const goalProgress = {
  get: (days?: number) => {
    const params = days ? `?days=${days}` : "";
    return request<GoalProgressResponse>(`/api/v1/users/me/goal-progress${params}`);
  },
};
