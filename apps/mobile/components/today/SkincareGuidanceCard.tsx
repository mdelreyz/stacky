import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { SkincareGuidance } from "@/lib/api";

export function SkincareGuidanceCard({ guidance }: { guidance: SkincareGuidance | null }) {
  if (!guidance) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="sun-o" size={16} color={colors.warningSkincare} />
        <Text style={styles.title}>Skin Protection</Text>
      </View>
      <Text style={styles.headline}>{guidance.headline}</Text>
      <Text style={styles.meta}>
        {guidance.location_name} · UV {guidance.uv_index.toFixed(1)}
      </Text>
      <Text style={styles.body}>{guidance.recommendation}</Text>
      {guidance.recommended_spf ? (
        <Text style={styles.detail}>
          Recommended SPF {guidance.recommended_spf}
          {guidance.reapply_hours ? ` · reapply every ${guidance.reapply_hours}h` : ""}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(248,243,232,0.9)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    shadowColor: colors.warningDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.warning,
  },
  headline: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.warningBrownDark,
  },
  meta: {
    fontSize: 12,
    color: colors.warningBrown,
    marginTop: 4,
  },
  body: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  detail: {
    fontSize: 12,
    color: colors.warningBrown,
    marginTop: 10,
    fontWeight: "600",
  },
});
