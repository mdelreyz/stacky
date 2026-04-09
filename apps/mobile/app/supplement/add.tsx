import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { supplements as supplementsApi } from "@/lib/api";
import { showError } from "@/lib/errors";

export default function AddSupplementScreen() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await supplementsApi.onboard({ name: name.trim() });
      router.replace(`/supplement/${result.id}`);
    } catch (e: any) {
      showError(e.message || "Failed to onboard supplement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Add Supplement</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Supplement Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Ashwagandha KSM-66"
          placeholderTextColor={colors.textPlaceholder}
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
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name="magic" size={16} color={colors.white} />
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
            <FontAwesome name="check" size={14} color={colors.success} />
            <Text style={styles.infoText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
  },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 10, lineHeight: 18 },
  onboardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  onboardButtonDisabled: { opacity: 0.5 },
  onboardButtonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  infoSection: { paddingHorizontal: 20, paddingBottom: 32 },
  infoTitle: { fontSize: 16, fontWeight: "600", color: colors.textSecondary, marginBottom: 12 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  infoText: { fontSize: 14, color: colors.textSecondary },
});
