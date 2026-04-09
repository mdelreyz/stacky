import type {
  ExerciseProgress,
  ExerciseStatsOverview,
  MuscleGroupVolume,
} from "@protocols/domain";

import { request } from "./core";

export const exerciseStats = {
  overview: () =>
    request<ExerciseStatsOverview>("/api/v1/users/me/exercise-stats/overview"),

  exerciseProgress: (exerciseId: string) =>
    request<ExerciseProgress>(
      `/api/v1/users/me/exercise-stats/exercise/${exerciseId}`,
    ),

  muscleGroups: (weeks?: number) => {
    const qs = weeks ? `?weeks=${weeks}` : "";
    return request<MuscleGroupVolume[]>(
      `/api/v1/users/me/exercise-stats/muscle-groups${qs}`,
    );
  },
};
