import { Text, TextInput, View } from "react-native";

import { styles } from "./styles";

export function NotificationQuietHoursCard({
  quietEnd,
  quietStart,
  setQuietEnd,
  setQuietStart,
}: {
  quietEnd: string;
  quietStart: string;
  setQuietEnd: (value: string) => void;
  setQuietStart: (value: string) => void;
}) {
  return (
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
  );
}
