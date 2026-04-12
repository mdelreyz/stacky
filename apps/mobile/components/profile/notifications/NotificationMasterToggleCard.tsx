import { Switch, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

import { styles } from "./styles";

export function NotificationMasterToggleCard({
  enabled,
  onChangeEnabled,
}: {
  enabled: boolean;
  onChangeEnabled: (value: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <FontAwesome name="bell" size={18} color={colors.primary} />
          <Text style={styles.toggleLabel}>Enable Reminders</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onChangeEnabled}
          trackColor={{ false: colors.surface, true: colors.primaryLight }}
          thumbColor={enabled ? colors.primary : colors.textMuted}
          accessibilityRole="switch"
          accessibilityLabel="Enable push notifications"
          accessibilityState={{ checked: enabled }}
        />
      </View>
      <Text style={styles.hint}>
        Receive push notifications when it&apos;s time to take your supplements, medications, and therapies.
      </Text>
    </View>
  );
}
