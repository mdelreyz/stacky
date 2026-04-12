import { Text, TextInput, View } from "react-native";

import { styles } from "./styles";

export function NotificationTimingCard({
  advanceMinutes,
  setAdvanceMinutes,
  setSnoozeMinutes,
  snoozeMinutes,
}: {
  advanceMinutes: string;
  setAdvanceMinutes: (value: string) => void;
  setSnoozeMinutes: (value: string) => void;
  snoozeMinutes: string;
}) {
  return (
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
  );
}
