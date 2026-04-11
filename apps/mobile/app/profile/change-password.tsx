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
import { showError } from "@/lib/errors";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const canSubmit =
    currentPassword.length >= 1 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword &&
    !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      showError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/\d/.test(newPassword)) {
      showError("Password must contain at least one digit");
      return;
    }

    setSaving(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (error: any) {
      showError(error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AmbientBackdrop canvasStyle={styles.backdrop} />
        <FadeInView>
          <FlowScreenHeader title="Password Changed" subtitle="Your password has been updated" />

          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <FontAwesome name="check" size={28} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Password updated successfully</Text>
            <Text style={styles.successBody}>
              Your new password is now active. You'll use it the next time you log in.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.doneButton, pressed && styles.buttonPressed]}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Change Password"
          subtitle="Update your account password"
        />

        <View style={styles.card}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textPlaceholder}
              autoComplete="current-password"
            />
            <Pressable
              onPress={() => setShowCurrent(!showCurrent)}
              accessibilityRole="button"
              accessibilityLabel={showCurrent ? "Hide current password" : "Show current password"}
              style={styles.eyeButton}
            >
              <FontAwesome
                name={showCurrent ? "eye-slash" : "eye"}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textPlaceholder}
              autoComplete="new-password"
            />
            <Pressable
              onPress={() => setShowNew(!showNew)}
              accessibilityRole="button"
              accessibilityLabel={showNew ? "Hide new password" : "Show new password"}
              style={styles.eyeButton}
            >
              <FontAwesome
                name={showNew ? "eye-slash" : "eye"}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.requirements}>
            <RequirementRow met={newPassword.length >= 8} label="At least 8 characters" />
            <RequirementRow met={/[A-Z]/.test(newPassword)} label="One uppercase letter" />
            <RequirementRow met={/\d/.test(newPassword)} label="One digit" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textPlaceholder}
          />
          {confirmPassword.length > 0 && confirmPassword !== newPassword ? (
            <Text style={styles.mismatchText}>Passwords do not match</Text>
          ) : null}
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Change password"
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Change Password</Text>
            )}
          </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.requirementRow}>
      <FontAwesome
        name={met ? "check-circle" : "circle-o"}
        size={14}
        color={met ? colors.success : colors.textMuted}
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 36, position: "relative" },
  backdrop: { top: -48, height: 1040 },
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
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
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
  inputFlex: { flex: 1 },
  eyeButton: {
    padding: 12,
    marginLeft: 4,
  },
  requirements: {
    marginTop: 14,
    gap: 8,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  requirementMet: {
    color: colors.success,
  },
  mismatchText: {
    fontSize: 13,
    color: colors.danger,
    marginTop: 8,
  },
  buttonSection: {
    paddingHorizontal: 16,
  },
  submitButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
  successCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  successBody: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 14,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
