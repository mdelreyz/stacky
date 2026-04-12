import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { NumberField } from "@/components/profile/NumberField";
import { colors } from "@/constants/Colors";
import type { InteractionMode } from "@/lib/api";
import { MODE_OPTIONS } from "./config";
import { styles } from "./styles";

export function ConstraintsStep({
  age,
  biologicalSex,
  interactionMode,
  maxSupplements,
  onBack,
  onContinue,
  onSetAge,
  onSetBiologicalSex,
  onSetInteractionMode,
  onSetMaxSupplements,
}: {
  age: string;
  biologicalSex: "male" | "female" | "other" | null;
  interactionMode: InteractionMode;
  maxSupplements: string;
  onBack: () => void;
  onContinue: () => void;
  onSetAge: (value: string) => void;
  onSetBiologicalSex: (value: "male" | "female" | "other" | null) => void;
  onSetInteractionMode: (value: InteractionMode) => void;
  onSetMaxSupplements: (value: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Step 2 of 3</Text>
        <Text style={styles.cardTitle}>Quick preferences</Text>
        <Text style={styles.cardSubtitle}>
          Optional — helps us calibrate recommendations. You can always change these later.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Interaction mode</Text>
          <View style={styles.modeGrid}>
            {MODE_OPTIONS.map((mode) => {
              const isSelected = interactionMode === mode.value;
              return (
                <Pressable
                  key={mode.value}
                  style={({ pressed }) => [
                    styles.modeCard,
                    isSelected && styles.modeCardSelected,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => onSetInteractionMode(mode.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={mode.label}
                  accessibilityState={{ selected: isSelected }}
                >
                  <FontAwesome
                    name={mode.icon as any}
                    size={16}
                    color={isSelected ? colors.primaryDarker : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.modeLabel,
                      isSelected && styles.modeLabelSelected,
                    ]}
                  >
                    {mode.label}
                  </Text>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <NumberField
            label="Max supplements per day"
            value={maxSupplements}
            onChangeText={onSetMaxSupplements}
          />
        </View>

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <NumberField
              label="Age"
              value={age}
              onChangeText={onSetAge}
            />
          </View>
          <View style={styles.inlineField}>
            <Text style={styles.fieldLabel}>Biological sex</Text>
            <View style={styles.sexRow}>
              {(["male", "female", "other"] as const).map((sex) => (
                <Pressable
                  key={sex}
                  style={({ pressed }) => [
                    styles.sexChip,
                    biologicalSex === sex && styles.sexChipSelected,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => onSetBiologicalSex(biologicalSex === sex ? null : sex)}
                  accessibilityRole="radio"
                  accessibilityLabel={sex}
                  accessibilityState={{ selected: biologicalSex === sex }}
                >
                  <Text
                    style={[
                      styles.sexChipText,
                      biologicalSex === sex && styles.sexChipTextSelected,
                    ]}
                  >
                    {sex.charAt(0).toUpperCase() + sex.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
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
