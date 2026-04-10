import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/lib/errors";

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
  }, [user]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      showError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      showError("Last name is required.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      router.back();
    } catch (error: any) {
      showError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title="Edit Profile" subtitle="Update your name" />

        <View style={styles.card}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.label}>Email</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyText}>{user.email}</Text>
          </View>
          <Text style={styles.helper}>Email cannot be changed.</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            saving && styles.buttonDisabled,
            pressed && !saving && styles.buttonPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save Changes"
        >
          <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 900 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(248,251,255,0.84)",
    fontSize: 16,
    color: colors.textPrimary,
  },
  readonlyField: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(243,247,251,0.9)",
  },
  readonlyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  primaryButton: {
    marginHorizontal: 16,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
