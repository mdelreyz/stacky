import { Switch, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

import { styles } from "./styles";

export function NotificationAlertsCard({
  interactionAlerts,
  onChangeInteractionAlerts,
  onChangeRefillReminders,
  onChangeStreakReminders,
  refillReminders,
  streakReminders,
}: {
  interactionAlerts: boolean;
  onChangeInteractionAlerts: (value: boolean) => void;
  onChangeRefillReminders: (value: boolean) => void;
  onChangeStreakReminders: (value: boolean) => void;
  refillReminders: boolean;
  streakReminders: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Additional Alerts</Text>
      <ToggleRow
        icon="fire"
        iconColor={colors.warning}
        label="Streak Reminders"
        value={streakReminders}
        onValueChange={onChangeStreakReminders}
        accessibilityLabel="Streak reminders"
      />
      <Text style={styles.alertHint}>Get notified when your adherence streak is at risk.</Text>

      <View style={{ marginTop: 16 }}>
        <ToggleRow
          icon="refresh"
          iconColor={colors.accent}
          label="Refill Reminders"
          value={refillReminders}
          onValueChange={onChangeRefillReminders}
          accessibilityLabel="Refill reminders"
        />
      </View>
      <Text style={styles.alertHint}>Get notified when supplements are running low.</Text>

      <View style={{ marginTop: 16 }}>
        <ToggleRow
          icon="exclamation-triangle"
          iconColor={colors.danger}
          label="Interaction Alerts"
          value={interactionAlerts}
          onValueChange={onChangeInteractionAlerts}
          accessibilityLabel="Interaction alerts"
        />
      </View>
      <Text style={styles.alertHint}>Get notified about new interaction warnings in your stack.</Text>
    </View>
  );
}

function ToggleRow({
  accessibilityLabel,
  icon,
  iconColor,
  label,
  onValueChange,
  value,
}: {
  accessibilityLabel: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  iconColor: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <FontAwesome name={icon} size={16} color={iconColor} />
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textMuted}
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}
