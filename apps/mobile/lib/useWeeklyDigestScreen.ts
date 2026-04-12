import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { weeklyDigest as digestApi, type WeeklyDigest } from "@/lib/api";
import { getTodayIsoDate, shiftIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";

export function useWeeklyDigestScreen() {
  const [weekEnd, setWeekEnd] = useState(getTodayIsoDate);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDigest = useCallback(async (endDate: string) => {
    setLoading(true);
    try {
      const result = await digestApi.get(endDate);
      setDigest(result);
    } catch (error: any) {
      showError(error.message || "Failed to load digest");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDigest(weekEnd);
    }, [loadDigest, weekEnd])
  );

  function goBack() {
    setWeekEnd((prev) => shiftIsoDate(prev, -7));
  }

  function goForward() {
    const next = shiftIsoDate(weekEnd, 7);
    if (next <= getTodayIsoDate()) {
      setWeekEnd(next);
    }
  }

  return {
    digest,
    goBack,
    goForward,
    loading,
  };
}
