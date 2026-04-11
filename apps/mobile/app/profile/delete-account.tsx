import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { auth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/lib/errors";

const CONFIRMATION_TEXT = "DELETE";

export default function DeleteAccountScreen() {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canSubmit =
    password.length >= 1 &&
    confirmation === CONFIRMATION_TEXT &&
    !deleting;

  const handleDelete = async () => {
    if (!canSubmit) return;

    setDeleting(true);
    try {
      await auth.deleteAccount(password);
      logout();
      router.replace("/auth/login");
    } catch (error: any) {
      showError(error.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Delete Account"
          subtitle="This action cannot be undone"
        />

        <View style={styles.warningCard}>
          <View style={styles.warningIconWrap}>
            <FontAwesome name="exclamation-triangle" size={24} color={colors.danger} />
          </View>
          <Text style={styles.warningTitle}>Permanent Action</Text>
          <Text style={styles.warningBody}>
            Deleting your account will permanently remove all your data including
            protocols, adherence history, health journal entries, exercise sessions,
            and preferences. This cannot be reversed.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Password</Text>
          <Text style={styles.hint}>Enter your current password to confirm</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.textPlaceholder}
            autoComplete="current-password"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Confirmation</Text>
          <Text style={styles.hint}>
            Type <Text style={styles.confirmationHighlight}>{CONFIRMATION_TEXT}</Text> to confirm
          </Text>
          <TextInput
            style={styles.input}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder={`Type ${CONFIRMATION_TEXT}`}
            placeholderTextColor={colors.textPlaceholder}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              !canSubmit && styles.deleteButtonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
            onPress={handleDelete}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Permanently delete account"
          >
            {deleting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <FontAwesome name="trash" size={16} color={colors.white} />
                <Text style={styles.deleteButtonText}>Delete My Account</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 36, position: "relative" },
  backdrop: { top: -48, height: 1040 },
  warningCard: {
    backgroundColor: colors.dangerLight,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(196,88,88,0.18)",
  },
  warningIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(196,88,88,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: 8,
  },
  warningBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  confirmationHighlight: {
    fontWeight: "700",
    color: colors.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(240,244,248,0.82)",
    fontSize: 16,
    color: colors.textPrimary,
  },
  buttonSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.danger,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  deleteButtonDisabled: { opacity: 0.4 },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  cancelPressed: { opacity: 0.9 },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
