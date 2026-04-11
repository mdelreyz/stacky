import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router, Stack } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { ProtocolsLogo } from "@/components/ProtocolsLogo";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    firstName.trim() && lastName.trim() && email.trim() && password.length >= 8;

  const handleSignup = async () => {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      await signup({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });
      router.replace("/onboarding");
    } catch (e: any) {
      setError(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false, title: "" }} />
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <View style={styles.logoCorner}>
        <ProtocolsLogo size={42} />
      </View>
      <View style={styles.inner}>
        <FadeInView>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />
            <Text style={styles.eyebrow}>Personal Protocols</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Build a calmer command center for supplements, recovery, movement, and daily adherence.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="First name"
                placeholderTextColor={colors.textPlaceholder}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
              />
              <TextInput
                style={styles.input}
                placeholder="Last name"
                placeholderTextColor={colors.textPlaceholder}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textPlaceholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <TextInput
                style={styles.input}
                placeholder="Password (min 8, 1 uppercase, 1 digit)"
                placeholderTextColor={colors.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (!canSubmit || loading) && styles.buttonDisabled,
                  pressed && !loading && styles.buttonPressed,
                ]}
                onPress={handleSignup}
                accessibilityRole="button"
                accessibilityLabel="Create Account"
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/auth/login" asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel="Log in">
                    <Text style={styles.link}>Log In</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </FadeInView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  backdrop: {
    top: -40,
    height: 960,
  },
  logoCorner: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
  },
  heroCard: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 28,
    backgroundColor: "rgba(54,94,130,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 4,
    overflow: "hidden",
    marginBottom: 18,
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -60,
    right: -14,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.14)",
    left: -12,
    bottom: -26,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.74)",
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textWhite,
    textAlign: "left",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 23,
  },
  formCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 3,
    padding: 20,
  },
  form: {
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "rgba(248,251,255,0.84)",
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 19,
  },
  button: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
