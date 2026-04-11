import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { notifications as notificationsApi } from "@/lib/api";
import { TAKE_WINDOW_OPTIONS } from "@/lib/schedule";
import { showError } from "@/lib/errors";
import type { NotificationPreferences } from "@/lib/api";

const DEFAULT_WINDOW_TIMES: Record<string, string> = {
  morning_fasted: "06:30",
  morning_with_food: "07:30",
  midday: "12:00",
  afternoon: "15:00",
  evening: "18:30",
  bedtime: "21:30",
};

const WINDOW_ICONS: Record<string, string> = {
  morning_fasted: "sun-o",
  morning_with_food: "coffee",
  midday: "clock-o",
  afternoon: "cloud",
  evening: "moon-o",
  bedtime: "star",
};

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for editing
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
    try {
      const data = await notificationsApi.getPreferences();
      setPrefs(data);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await notificationsApi.updatePreferences({
        enabled,
        enabled_windows: Array.from(enabledWindows),
        window_times: windowTimes,
        quiet_start: quietStart || null,
        quiet_end: quietEnd || null,
        advance_minutes: parseInt(advanceMinutes) || 5,
        snooze_minutes: parseInt(snoozeMinutes) || 10,
        streak_reminders: streakReminders,
        refill_reminders: refillReminders,
        interaction_alerts: interactionAlerts,
      });
      setPrefs(updated);
    } catch (error: any) {
      showError(error.message || "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleWindow = (window: string) => {
    setEnabledWindows((prev) => {
      const next = new Set(prev);
      if (next.has(window)) {
        next.delete(window);
      } else {
        next.add(window);
      }
      return next;
    });
  };

  const updateWindowTime = (window: string, time: string) => {
    setWindowTimes((prev) => ({ ...prev, [window]: time }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title="Notifications" subtitle="Configure reminders for your daily protocol" />

        {/* Master toggle */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <FontAwesome name="bell" size={18} color={colors.primary} />
              <Text style={styles.toggleLabel}>Enable Reminders</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.surface, true: colors.primaryLight }}
              thumbColor={enabled ? colors.primary : colors.textMuted}
              accessibilityRole="switch"
              accessibilityLabel="Enable push notifications"
              accessibilityState={{ checked: enabled }}
            />
          </View>
          <Text style={styles.hint}>
            Receive push notifications when it's time to take your supplements, medications, and therapies.
          </Text>
        </View>

        {/* Window-specific reminders */}
        {enabled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Take Window Reminders</Text>
            <Text style={styles.sectionHint}>Toggle reminders for each window and set the reminder time.</Text>

            {TAKE_WINDOW_OPTIONS.map(({ value, label }) => {
              const isActive = enabledWindows.has(value);
              const iconName = WINDOW_ICONS[value] ?? "clock-o";
              const time = windowTimes[value] ?? DEFAULT_WINDOW_TIMES[value] ?? "08:00";

              return (
                <View key={value} style={[styles.windowRow, !isActive && styles.windowRowDisabled]}>
                  <Pressable
                    style={styles.windowToggle}
                    onPress={() => toggleWindow(value)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${label} reminder`}
                    accessibilityState={{ checked: isActive }}
                  >
                    <FontAwesome
                      name={iconName as any}
                      size={16}
                      color={isActive ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.windowLabel, !isActive && styles.windowLabelDisabled]}>
                      {label}
                    </Text>
                  </Pressable>
                  {isActive && (
                    <TextInput
                      style={styles.timeInput}
                      value={time}
                      onChangeText={(text) => updateWindowTime(value, text)}
                      placeholder="HH:MM"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      accessibilityLabel={`${label} reminder time`}
                    />
                  )}
                  {!isActive && <Text style={styles.offLabel}>Off</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* Quiet hours */}
        {enabled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            <Text style={styles.sectionHint}>No notifications during these hours.</Text>
            <View style={styles.quietRow}>
              <View style={styles.quietField}>
                <Text style={styles.quietLabel}>From</Text>
                <TextInput
                  style={styles.timeInput}
                  value={quietStart}
                  onChangeText={setQuietStart}
                  placeholder="22:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  accessibilityLabel="Quiet hours start time"
                />
              </View>
              <View style={styles.quietField}>
                <Text style={styles.quietLabel}>To</Text>
                <TextInput
                  style={styles.timeInput}
                  value={quietEnd}
                  onChangeText={setQuietEnd}
                  placeholder="07:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  accessibilityLabel="Quiet hours end time"
                />
              </View>
            </View>
          </View>
        )}

        {/* Timing */}
        {enabled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timing</Text>
            <View style={styles.timingRow}>
              <Text style={styles.timingLabel}>Advance notice</Text>
              <View style={styles.timingInputRow}>
                <TextInput
                  style={styles.smallInput}
                  value={advanceMinutes}
                  onChangeText={setAdvanceMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                  accessibilityLabel="Advance notice in minutes"
                />
                <Text style={styles.timingUnit}>min before</Text>
              </View>
            </View>
            <View style={styles.timingRow}>
              <Text style={styles.timingLabel}>Snooze duration</Text>
              <View style={styles.timingInputRow}>
                <TextInput
                  style={styles.smallInput}
                  value={snoozeMinutes}
                  onChangeText={setSnoozeMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                  accessibilityLabel="Snooze duration in minutes"
                />
                <Text style={styles.timingUnit}>min</Text>
              </View>
            </View>
          </View>
        )}

        {/* Additional alerts */}
        {enabled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Alerts</Text>
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <FontAwesome name="fire" size={16} color={colors.warning} />
                <Text style={styles.toggleLabel}>Streak Reminders</Text>
              </View>
              <Switch
                value={streakReminders}
                onValueChange={setStreakReminders}
                trackColor={{ false: colors.surface, true: colors.primaryLight }}
                thumbColor={streakReminders ? colors.primary : colors.textMuted}
                accessibilityRole="switch"
                accessibilityLabel="Streak reminders"
                accessibilityState={{ checked: streakReminders }}
              />
            </View>
            <Text style={styles.alertHint}>Get notified when your adherence streak is at risk.</Text>

            <View style={[styles.toggleRow, { marginTop: 16 }]}>
              <View style={styles.toggleCopy}>
                <FontAwesome name="refresh" size={16} color={colors.accent} />
                <Text style={styles.toggleLabel}>Refill Reminders</Text>
              </View>
              <Switch
                value={refillReminders}
                onValueChange={setRefillReminders}
                trackColor={{ false: colors.surface, true: colors.primaryLight }}
                thumbColor={refillReminders ? colors.primary : colors.textMuted}
                accessibilityRole="switch"
                accessibilityLabel="Refill reminders"
                accessibilityState={{ checked: refillReminders }}
              />
            </View>
            <Text style={styles.alertHint}>Get notified when supplements are running low.</Text>

            <View style={[styles.toggleRow, { marginTop: 16 }]}>
              <View style={styles.toggleCopy}>
                <FontAwesome name="exclamation-triangle" size={16} color={colors.danger} />
                <Text style={styles.toggleLabel}>Interaction Alerts</Text>
              </View>
              <Switch
                value={interactionAlerts}
                onValueChange={setInteractionAlerts}
                trackColor={{ false: colors.surface, true: colors.primaryLight }}
                thumbColor={interactionAlerts ? colors.primary : colors.textMuted}
                accessibilityRole="switch"
                accessibilityLabel="Interaction alerts"
                accessibilityState={{ checked: interactionAlerts }}
              />
            </View>
            <Text style={styles.alertHint}>Get notified about new interaction warnings in your stack.</Text>
          </View>
        )}

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            saving && styles.buttonDisabled,
            pressed && !saving && styles.buttonPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save notification settings"
        >
          <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Settings"}</Text>
        </Pressable>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 28, position: "relative" },
  backdrop: { top: -48, height: 900 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 17,
  },
  windowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  windowRowDisabled: {
    opacity: 0.5,
  },
  windowToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  windowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  windowLabelDisabled: {
    color: colors.textMuted,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: "rgba(248,251,255,0.84)",
    width: 80,
    textAlign: "center",
    fontWeight: "600",
  },
  offLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  quietRow: {
    flexDirection: "row",
    gap: 16,
  },
  quietField: {
    flex: 1,
  },
  quietLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  timingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  timingInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: "rgba(248,251,255,0.84)",
    width: 52,
    textAlign: "center",
    fontWeight: "600",
  },
  timingUnit: {
    fontSize: 13,
    color: colors.textMuted,
  },
  alertHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginLeft: 26,
  },
  primaryButton: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
