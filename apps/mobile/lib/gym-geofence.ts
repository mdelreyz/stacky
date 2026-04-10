/**
 * Gym geofencing — monitors saved gym locations and surfaces the default routine
 * when the user arrives at a gym.
 *
 * Uses a lightweight foreground polling approach (no background task / no
 * expo-location dependency). The exercise tab calls `checkCurrentGym()` on focus
 * to detect arrival at a saved gym.
 *
 * For full background geofencing, install expo-location + expo-task-manager
 * and swap in the native geofencing APIs.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { gymLocations as gymApi } from "@/lib/api";
import type { GymLocationMatch } from "@protocols/domain";

let _lastMatchId: string | null = null;
const _arrivalCallbacks = new Set<(match: GymLocationMatch) => void>();

/**
 * One-shot check: get current location via browser/native API and match
 * against the user's saved gym locations.
 */
export async function checkCurrentGym(): Promise<GymLocationMatch | null> {
  try {
    const position = await getCurrentPosition();
    if (!position) return null;
    return await gymApi.match(position.latitude, position.longitude);
  } catch {
    return null;
  }
}

/**
 * Check current gym and notify if the user just arrived (not already notified).
 */
export async function checkAndNotifyGymArrival(): Promise<GymLocationMatch | null> {
  const match = await checkCurrentGym();
  if (!match || !match.matched || !match.gym_location) return null;

  if (match.gym_location.id === _lastMatchId) return match;

  _lastMatchId = match.gym_location.id;

  // Notify all registered callbacks
  for (const cb of _arrivalCallbacks) {
    cb(match);
  }

  return match;
}

/**
 * Reset the last match so the next check will re-trigger arrival notification.
 */
export function resetGymArrival(): void {
  _lastMatchId = null;
}

/**
 * Hook to react to gym arrivals. Call from the exercise tab.
 * Checks on mount and returns the latest match.
 */
export function useGymArrival(): {
  match: GymLocationMatch | null;
  checking: boolean;
  recheck: () => void;
} {
  const [match, setMatch] = useState<GymLocationMatch | null>(null);
  const [checking, setChecking] = useState(false);

  const doCheck = useCallback(async () => {
    setChecking(true);
    try {
      const result = await checkAndNotifyGymArrival();
      setMatch(result);
    } catch {
      // Ignore
    } finally {
      setChecking(false);
    }
  }, []);

  // Listen for external arrival notifications
  useEffect(() => {
    const cb = (m: GymLocationMatch) => setMatch(m);
    _arrivalCallbacks.add(cb);
    return () => {
      _arrivalCallbacks.delete(cb);
    };
  }, []);

  return { match, checking, recheck: doCheck };
}

// ─── Location helpers ─────────────────────────────────────────────

interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Get current position using the web Geolocation API (works in Expo/RN web
 * and as a polyfill on native via expo). Returns null if unavailable or denied.
 */
function getCurrentPosition(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
    );
  });
}
