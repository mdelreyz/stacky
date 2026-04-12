import { Pressable, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { TAKE_WINDOW_OPTIONS } from "@/lib/schedule";

import { DEFAULT_WINDOW_TIMES, WINDOW_ICONS } from "./config";
import { styles } from "./styles";

export function NotificationWindowsCard({
  enabledWindows,
  onToggleWindow,
  onUpdateWindowTime,
  windowTimes,
}: {
  enabledWindows: Set<string>;
  onToggleWindow: (window: string) => void;
  onUpdateWindowTime: (window: string, time: string) => void;
  windowTimes: Record<string, string>;
}) {
  return (
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
              onPress={() => onToggleWindow(value)}
              accessibilityRole="checkbox"
              accessibilityLabel={`${label} reminder`}
              accessibilityState={{ checked: isActive }}
            >
              <FontAwesome name={iconName as any} size={16} color={isActive ? colors.primary : colors.textMuted} />
              <Text style={[styles.windowLabel, !isActive && styles.windowLabelDisabled]}>{label}</Text>
            </Pressable>
            {isActive ? (
              <TextInput
                style={styles.timeInput}
                value={time}
                onChangeText={(text) => onUpdateWindowTime(value, text)}
                placeholder="HH:MM"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                accessibilityLabel={`${label} reminder time`}
              />
            ) : (
              <Text style={styles.offLabel}>Off</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
