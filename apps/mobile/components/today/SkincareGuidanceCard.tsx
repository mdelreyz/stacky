import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import type { SkincareGuidance } from "@/lib/api";

export function SkincareGuidanceCard({ guidance }: { guidance: SkincareGuidance | null }) {
  if (!guidance) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="sun-o" size={16} color="#f08c00" />
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
    backgroundColor: "#fff4e6",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffd8a8",
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
    color: "#e67700",
  },
  headline: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7c2d12",
  },
  meta: {
    fontSize: 12,
    color: "#9a3412",
    marginTop: 4,
  },
  body: {
    fontSize: 13,
    color: "#495057",
    marginTop: 8,
    lineHeight: 18,
  },
  detail: {
    fontSize: 12,
    color: "#9a3412",
    marginTop: 10,
    fontWeight: "600",
  },
});
