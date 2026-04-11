import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

export function SupplementProfileFallback({
  status,
  error,
  onRetry,
  retrying = false,
}: {
  status: "generating" | "failed";
  error: string | null;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <View style={styles.noProfile}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      {status === "failed" ? (
        <>
          <FontAwesome name="warning" size={32} color={colors.danger} />
          <Text style={styles.noProfileText}>AI profile generation failed</Text>
          <Text style={styles.noProfileHint}>
            {error || "Retry onboarding once Claude access is configured."}
          </Text>
          {onRetry ? (
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                retrying && styles.retryButtonDisabled,
                pressed && !retrying && styles.retryButtonPressed,
              ]}
              onPress={onRetry}
              disabled={retrying}
              accessibilityRole="button"
              accessibilityLabel="Retry AI profile generation"
            >
              {retrying ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <FontAwesome name="refresh" size={14} color={colors.white} />
                  <Text style={styles.retryButtonText}>Retry Generation</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.noProfileText}>Generating AI profile</Text>
          <Text style={styles.noProfileHint}>
            {error || "This page refreshes automatically when the profile is ready."}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  noProfile: {
    alignItems: "center",
    padding: 36,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
    overflow: "hidden",
  },
  glowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(123,220,225,0.1)",
    top: -50,
    right: -10,
  },
  glowSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.1)",
    bottom: -18,
    left: -12,
  },
  noProfileText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: "600",
  },
  noProfileHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
