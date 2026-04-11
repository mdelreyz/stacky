import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";

const PROMPTS = [
  "I want to optimize for longevity and cognitive performance",
  "I'm dealing with poor sleep and high stress",
  "Help me build a recovery stack for training",
  "I want to improve my skin and hair health",
];

type WizardWelcomeCardProps = {
  onSelectPrompt: (prompt: string) => void;
};

export function WizardWelcomeCard({ onSelectPrompt }: WizardWelcomeCardProps) {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeGlowLarge} />
      <View style={styles.welcomeGlowSmall} />
      <FontAwesome name="magic" size={28} color={colors.primaryDark} />
      <Text style={styles.welcomeTitle}>Build Your Protocol</Text>
      <Text style={styles.welcomeText}>
        Tell me about your health goals, concerns, or what you're looking to optimize. I'll ask
        follow-up questions and build a personalized protocol for you.
      </Text>
      <View style={styles.promptGrid}>
        {PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            style={({ pressed }) => [styles.promptChip, pressed && styles.softPressed]}
            onPress={() => onSelectPrompt(prompt)}
            accessibilityRole="button"
            accessibilityLabel={prompt}
          >
            <Text style={styles.promptChipText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
    overflow: "hidden",
  },
  welcomeGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(123,220,225,0.12)",
    top: -48,
    right: -12,
  },
  welcomeGlowSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -18,
    left: -10,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  promptGrid: {
    gap: 8,
    marginTop: 16,
    width: "100%",
  },
  promptChip: {
    backgroundColor: "rgba(243,247,251,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  promptChipText: {
    fontSize: 13,
    color: colors.primaryDarker,
    lineHeight: 18,
  },
  softPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
