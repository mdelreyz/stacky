import { Pressable, Text, View } from "react-native";

import { styles } from "./styles";

export function NotificationVerificationCard({
  onSendTestPush,
  sendingTestPush,
}: {
  onSendTestPush: () => void;
  sendingTestPush: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Verify Delivery</Text>
      <Text style={styles.sectionHint}>
        Send a real Expo push to this device using your current notification registration.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          sendingTestPush && styles.buttonDisabled,
          pressed && !sendingTestPush && styles.buttonPressed,
        ]}
        onPress={onSendTestPush}
        disabled={sendingTestPush}
        accessibilityRole="button"
        accessibilityLabel="Send a test push notification"
      >
        <Text style={styles.secondaryText}>{sendingTestPush ? "Sending..." : "Send Test Push"}</Text>
      </Pressable>
      <Text style={styles.helperText}>Physical devices or development builds work best for push verification.</Text>
    </View>
  );
}
