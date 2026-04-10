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
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { medications as medicationsApi } from "@/lib/api";
import { showError } from "@/lib/errors";

export default function AddMedicationScreen() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await medicationsApi.onboard({ name: name.trim() });
      if (result.status === "failed" && result.ai_error) {
        showError(result.ai_error);
      }
      router.replace(`/medication/${result.id}`);
    } catch (e: any) {
      showError(e.message || "Failed to onboard medication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="Add Medication"
        subtitle="Search or onboard a new medication with AI"
      />

      <View style={styles.card}>
        <Text style={styles.label}>Medication Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Finasteride 1mg, Tretinoin, Metformin"
          placeholderTextColor={colors.textPlaceholder}
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          onSubmitEditing={handleOnboard}
        />
        <Text style={styles.hint}>
          Enter the medication name. If it's already in our catalog, you'll see
          its profile immediately. If it's new, our AI will generate a
          comprehensive medication profile.
        </Text>
      </View>

      <Pressable
        style={[
          styles.onboardButton,
          (!name.trim() || loading) && styles.onboardButtonDisabled,
        ]}
        onPress={handleOnboard}
        disabled={!name.trim() || loading}
        accessibilityRole="button"
        accessibilityLabel="Start Onboarding"
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
          "Drug class & mechanism of action",
          "Typical dosages & frequency",
          "Known drug interactions",
          "Timing recommendations",
          "Monitoring notes",
          "Safety & contraindications",
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
