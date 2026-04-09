import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

export function SupplementProfileFallback({
  status,
  error,
}: {
  status: "generating" | "failed";
  error: string | null;
}) {
  return (
    <View style={styles.noProfile}>
      {status === "failed" ? (
        <>
          <FontAwesome name="warning" size={32} color={colors.danger} />
          <Text style={styles.noProfileText}>AI profile generation failed</Text>
          <Text style={styles.noProfileHint}>
            {error || "Retry onboarding once Claude access is configured."}
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.noProfileText}>Generating AI profile</Text>
          <Text style={styles.noProfileHint}>
            This page refreshes automatically when the profile is ready.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  noProfile: {
    alignItems: "center",
    padding: 40,
  },
  noProfileText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 12,
  },
  noProfileHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 19,
    textAlign: "center",
  },
});
