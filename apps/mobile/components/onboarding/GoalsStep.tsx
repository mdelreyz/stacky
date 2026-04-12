import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { HealthGoal } from "@/lib/api";
import { GOAL_OPTIONS } from "./config";
import { styles } from "./styles";

export function GoalsStep({
  selectedGoals,
  onToggleGoal,
  onBack,
  onContinue,
}: {
  selectedGoals: HealthGoal[];
  onToggleGoal: (goal: HealthGoal) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Step 1 of 3</Text>
        <Text style={styles.cardTitle}>What are your health goals?</Text>
        <Text style={styles.cardSubtitle}>
          Select up to 5 goals. These drive AI recommendations, protocol scoring, and your daily plan.
        </Text>

        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.value);
            return (
              <Pressable
                key={goal.value}
                style={({ pressed }) => [
                  styles.goalChip,
                  isSelected && styles.goalChipSelected,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => onToggleGoal(goal.value)}
                accessibilityRole="checkbox"
                accessibilityLabel={goal.label}
                accessibilityState={{ checked: isSelected }}
              >
                <FontAwesome
                  name={goal.icon as any}
                  size={14}
                  color={isSelected ? colors.primaryDarker : colors.textMuted}
                />
                <Text
                  style={[
                    styles.goalChipText,
                    isSelected && styles.goalChipTextSelected,
                  ]}
                >
                  {goal.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>{selectedGoals.length}/5 selected</Text>
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <FontAwesome name="arrow-left" size={14} color={colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, styles.navButton, pressed && styles.buttonPressed]}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
          <FontAwesome name="arrow-right" size={14} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
