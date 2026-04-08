import { StyleSheet, Text, View, ScrollView } from "react-native";

export default function TodayScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <Text style={styles.title}>Your Protocol</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Morning — Fasted</Text>
        <Text style={styles.placeholder}>No supplements scheduled yet.</Text>
        <Text style={styles.hint}>
          Add supplements in the Protocols tab to see your daily plan here.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Morning — With Food</Text>
        <Text style={styles.placeholder}>—</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Midday</Text>
        <Text style={styles.placeholder}>—</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evening</Text>
        <Text style={styles.placeholder}>—</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bedtime</Text>
        <Text style={styles.placeholder}>—</Text>
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
  date: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
  },
  section: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: "#adb5bd",
  },
  hint: {
    fontSize: 13,
    color: "#868e96",
    marginTop: 8,
    fontStyle: "italic",
  },
});
