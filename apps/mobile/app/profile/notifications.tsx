import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { NotificationAlertsCard } from "@/components/profile/notifications/NotificationAlertsCard";
import { NotificationMasterToggleCard } from "@/components/profile/notifications/NotificationMasterToggleCard";
import { NotificationQuietHoursCard } from "@/components/profile/notifications/NotificationQuietHoursCard";
import { NotificationTimingCard } from "@/components/profile/notifications/NotificationTimingCard";
import { NotificationVerificationCard } from "@/components/profile/notifications/NotificationVerificationCard";
import { NotificationWindowsCard } from "@/components/profile/notifications/NotificationWindowsCard";
import { styles } from "@/components/profile/notifications/styles";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { useNotificationSettingsScreen } from "@/lib/useNotificationSettingsScreen";

export default function NotificationSettingsScreen() {
  const {
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
  } = useNotificationSettingsScreen();

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
        <NotificationMasterToggleCard enabled={enabled} onChangeEnabled={setEnabled} />
        {enabled ? (
          <>
            <NotificationWindowsCard
              enabledWindows={enabledWindows}
              onToggleWindow={toggleWindow}
              onUpdateWindowTime={updateWindowTime}
              windowTimes={windowTimes}
            />
            <NotificationQuietHoursCard
              quietEnd={quietEnd}
              quietStart={quietStart}
              setQuietEnd={setQuietEnd}
              setQuietStart={setQuietStart}
            />
            <NotificationTimingCard
              advanceMinutes={advanceMinutes}
              setAdvanceMinutes={setAdvanceMinutes}
              setSnoozeMinutes={setSnoozeMinutes}
              snoozeMinutes={snoozeMinutes}
            />
            <NotificationAlertsCard
              interactionAlerts={interactionAlerts}
              onChangeInteractionAlerts={setInteractionAlerts}
              onChangeRefillReminders={setRefillReminders}
              onChangeStreakReminders={setStreakReminders}
              refillReminders={refillReminders}
              streakReminders={streakReminders}
            />
          </>
        ) : null}
        <NotificationVerificationCard onSendTestPush={handleSendTestPush} sendingTestPush={sendingTestPush} />
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
