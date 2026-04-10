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
        style={({ pressed }) => [
          styles.primaryButton,
          saving && styles.buttonDisabled,
          pressed && !saving && styles.pressed,
        ]}
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
          style={({ pressed }) => [
            styles.secondaryButton,
            secondaryVariant === "danger" ? styles.secondaryDanger : styles.secondaryNeutral,
            saving && styles.buttonDisabled,
            pressed && !saving && styles.pressed,
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
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3,
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
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: "#efd3d3",
  },
  secondaryDangerText: {
    color: colors.dangerDark,
  },
  secondaryNeutral: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: "rgba(255,255,255,0.92)",
  },
  secondaryNeutralText: {
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
});
