import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { styles } from "./styles";

export function WelcomeStep({
  firstName,
  onGetStarted,
  onSkip,
}: {
  firstName?: string | null;
  onGetStarted: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.heroCard}>
        <View style={styles.heroGlowLarge} />
        <View style={styles.heroGlowSmall} />
        <Text style={styles.heroEyebrow}>Welcome</Text>
        <Text style={styles.heroTitle}>Hi, {firstName ?? "there"}</Text>
        <Text style={styles.heroSubtitle}>
          Let&apos;s set up your personal health command center. This takes about a minute and helps us tailor
          everything to your goals.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        onPress={onGetStarted}
        accessibilityRole="button"
        accessibilityLabel="Get started"
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <FontAwesome name="arrow-right" size={14} color={colors.white} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.skipButton, pressed && styles.buttonPressed]}
        onPress={onSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </Pressable>
    </View>
  );
}
