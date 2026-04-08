import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { supplements as supplementsApi } from "@/lib/api";

export default function AddSupplementScreen() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await supplementsApi.onboard({ name: name.trim() });
      if (result.status === "ready" || result.ai_profile) {
        router.replace(`/supplement/${result.id}`);
      } else {
        // Profile is being generated — go to detail page which will show loading state
        router.replace(`/supplement/${result.id}`);
      }
    } catch (e: any) {
      const message = e.message || "Failed to onboard supplement";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color="#495057" />
        </Pressable>
        <Text style={styles.title}>Add Supplement</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Supplement Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Ashwagandha KSM-66"
          placeholderTextColor="#adb5bd"
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          onSubmitEditing={handleOnboard}
        />
        <Text style={styles.hint}>
          Enter the supplement name. If it's already in our catalog, you'll see
          its AI-generated profile immediately. If it's new, our AI will
          generate a comprehensive profile.
        </Text>
      </View>

      <Pressable
        style={[
          styles.onboardButton,
          (!name.trim() || loading) && styles.onboardButtonDisabled,
        ]}
        onPress={handleOnboard}
        disabled={!name.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome name="magic" size={16} color="#fff" />
            <Text style={styles.onboardButtonText}>Find or Generate Profile</Text>
          </>
        )}
      </Pressable>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>What gets generated?</Text>
        {[
          "Mechanism of action",
          "Optimal dosage & timing",
          "Drug & supplement interactions",
          "Synergies with other supplements",
          "Cycling recommendations",
          "Bioavailability & absorption tips",
          "Safety notes & contraindications",
        ].map((item) => (
          <View key={item} style={styles.infoItem}>
            <FontAwesome name="check" size={14} color="#51cf66" />
            <Text style={styles.infoText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#212529" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#495057", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#212529",
    backgroundColor: "#f8f9fa",
  },
  hint: { fontSize: 13, color: "#868e96", marginTop: 10, lineHeight: 18 },
  onboardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#228be6",
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  onboardButtonDisabled: { opacity: 0.5 },
  onboardButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  infoSection: { paddingHorizontal: 20, paddingBottom: 32 },
  infoTitle: { fontSize: 16, fontWeight: "600", color: "#495057", marginBottom: 12 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  infoText: { fontSize: 14, color: "#495057" },
});
