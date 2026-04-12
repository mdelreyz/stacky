import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

import { FEATURE_ITEMS } from "./config";
import { styles } from "./styles";

export function SupplementFeaturesCard() {
  return (
    <View style={styles.featuresCard}>
      <Text style={styles.sectionTitle}>What the profile covers</Text>
      <View style={styles.featureGrid}>
        {FEATURE_ITEMS.map((item) => (
          <View key={item.label} style={styles.featureTile}>
            <View style={styles.featureIconWrap}>
              <FontAwesome name={item.icon} size={14} color={colors.primaryDark} />
            </View>
            <Text style={styles.featureLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
