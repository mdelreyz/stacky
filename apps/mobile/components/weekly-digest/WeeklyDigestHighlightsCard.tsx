import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

import { styles } from "./styles";

export function WeeklyDigestHighlightsCard({ highlights }: { highlights: string[] }) {
  if (highlights.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome name="star" size={15} color={colors.warning} />
        <Text style={styles.cardTitle}>Highlights</Text>
      </View>
      {highlights.map((highlight, index) => (
        <Text key={`${highlight}-${index}`} style={styles.highlightText}>
          {highlight}
        </Text>
      ))}
    </View>
  );
}
