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

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
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

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.onboardButton,
              (!name.trim() || loading) && styles.onboardButtonDisabled,
              pressed && name.trim() && !loading && styles.buttonPressed,
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
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoEyebrow}>AI Output</Text>
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
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1040 },
  section: { paddingHorizontal: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.72)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "rgba(248,251,255,0.9)",
  },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 12, lineHeight: 20 },
  onboardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  onboardButtonDisabled: { opacity: 0.5 },
  onboardButtonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  infoSection: {
    marginHorizontal: 16,
    padding: 18,
    paddingBottom: 24,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  infoEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoTitle: { fontSize: 22, fontWeight: "800", color: colors.textSecondary, marginBottom: 12 },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  infoText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
