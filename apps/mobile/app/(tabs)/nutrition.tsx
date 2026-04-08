import { StyleSheet, Text, View, ScrollView } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function NutritionScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition Cycling</Text>
        <Text style={styles.subtitle}>
          Carb, protein, and keto cycling schedules
        </Text>
      </View>

      <View style={styles.emptyCard}>
        <FontAwesome
          name="pie-chart"
          size={40}
          color="#dee2e6"
          style={{ marginBottom: 12 }}
        />
        <Text style={styles.emptyText}>No nutrition cycles configured</Text>
        <Text style={styles.emptyHint}>
          Set up carb cycling, protein cycling, or keto cycling to see your
          daily macro targets and phase calendar here.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#868e96",
  },
  emptyHint: {
    fontSize: 13,
    color: "#adb5bd",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});
