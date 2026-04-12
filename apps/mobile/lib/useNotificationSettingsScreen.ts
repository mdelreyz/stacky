import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "expo-router";

import { notifications as notificationsApi } from "@/lib/api";
import { showError } from "@/lib/errors";

import { DEFAULT_WINDOW_TIMES } from "@/components/profile/notifications/config";

function parseMinuteField(value: string, fallback: number) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useNotificationSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [enabledWindows, setEnabledWindows] = useState<Set<string>>(new Set());
  const [windowTimes, setWindowTimes] = useState<Record<string, string>>({});
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [advanceMinutes, setAdvanceMinutes] = useState("5");
  const [snoozeMinutes, setSnoozeMinutes] = useState("10");
  const [streakReminders, setStreakReminders] = useState(true);
  const [refillReminders, setRefillReminders] = useState(true);
  const [interactionAlerts, setInteractionAlerts] = useState(true);

  const loadPrefs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getPreferences();
      setEnabled(data.enabled);
      setEnabledWindows(new Set(data.enabled_windows ?? Object.keys(DEFAULT_WINDOW_TIMES)));
      setWindowTimes(data.window_times ?? { ...DEFAULT_WINDOW_TIMES });
      setQuietStart(data.quiet_start ?? "");
      setQuietEnd(data.quiet_end ?? "");
      setAdvanceMinutes(String(data.advance_minutes ?? 5));
      setSnoozeMinutes(String(data.snooze_minutes ?? 10));
      setStreakReminders(data.streak_reminders);
      setRefillReminders(data.refill_reminders);
      setInteractionAlerts(data.interaction_alerts);
    } catch (error: any) {
      showError(error.message || "Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPrefs();
    }, [loadPrefs])
  );

  async function handleSave() {
    setSaving(true);
    try {
      await notificationsApi.updatePreferences({
        enabled,
        enabled_windows: Array.from(enabledWindows),
        window_times: windowTimes,
        quiet_start: quietStart || null,
        quiet_end: quietEnd || null,
        advance_minutes: parseMinuteField(advanceMinutes, 5),
        snooze_minutes: parseMinuteField(snoozeMinutes, 10),
        streak_reminders: streakReminders,
        refill_reminders: refillReminders,
        interaction_alerts: interactionAlerts,
      });
    } catch (error: any) {
      showError(error.message || "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestPush() {
    setSendingTestPush(true);
    try {
      const result = await notificationsApi.sendTestPush();
      const dialogTitle = result.status === "sent" ? "Test Push Sent" : "Push Not Sent";
      const detail = result.title && result.body ? `\n\n${result.title}\n${result.body}` : "";
      Alert.alert(dialogTitle, `${result.message}${detail}`);
    } catch (error: any) {
      showError(error.message || "Failed to send test push");
    } finally {
      setSendingTestPush(false);
    }
  }

  function toggleWindow(window: string) {
    setEnabledWindows((prev) => {
      const next = new Set(prev);
      if (next.has(window)) {
        next.delete(window);
      } else {
        next.add(window);
      }
      return next;
    });
  }

  function updateWindowTime(window: string, time: string) {
    setWindowTimes((prev) => ({ ...prev, [window]: time }));
  }

  return {
    advanceMinutes,
    enabled,
    enabledWindows,
    handleSave,
    handleSendTestPush,
    interactionAlerts,
    loading,
    quietEnd,
    quietStart,
    refillReminders,
    saving,
    sendingTestPush,
    setAdvanceMinutes,
    setEnabled,
    setInteractionAlerts,
    setQuietEnd,
    setQuietStart,
    setRefillReminders,
    setSnoozeMinutes,
    setStreakReminders,
    snoozeMinutes,
    streakReminders,
    toggleWindow,
    updateWindowTime,
    windowTimes,
  };
}
