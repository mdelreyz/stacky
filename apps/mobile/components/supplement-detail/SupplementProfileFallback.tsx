import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
          <FontAwesome name="warning" size={32} color="#e03131" />
          <Text style={styles.noProfileText}>AI profile generation failed</Text>
          <Text style={styles.noProfileHint}>
            {error || "Retry onboarding once Claude access is configured."}
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="small" color="#228be6" />
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
    color: "#868e96",
    marginTop: 12,
  },
  noProfileHint: {
    fontSize: 13,
    color: "#868e96",
    marginTop: 8,
    lineHeight: 19,
    textAlign: "center",
  },
});
