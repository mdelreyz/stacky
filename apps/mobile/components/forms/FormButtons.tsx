import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

export function FormButtons({
  saving,
  primaryLabel,
  onSubmit,
  secondaryLabel,
  secondaryVariant = "danger",
  onSecondaryAction,
}: {
  saving: boolean;
  primaryLabel: string;
  onSubmit: () => void;
  secondaryLabel?: string;
  secondaryVariant?: "neutral" | "danger";
  onSecondaryAction?: () => void;
}) {
  return (
    <>
      <Pressable
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name="check" size={16} color={colors.white} />
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </>
        )}
      </Pressable>

      {secondaryLabel && onSecondaryAction ? (
        <Pressable
          style={[
            styles.secondaryButton,
            secondaryVariant === "danger" ? styles.secondaryDanger : styles.secondaryNeutral,
            saving && styles.buttonDisabled,
          ]}
          onPress={onSecondaryAction}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              secondaryVariant === "danger" ? styles.secondaryDangerText : styles.secondaryNeutralText,
            ]}
          >
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryDanger: {
    backgroundColor: colors.dangerLight,
  },
  secondaryDangerText: {
    color: colors.dangerDark,
  },
  secondaryNeutral: {
    backgroundColor: colors.surface,
  },
  secondaryNeutralText: {
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
