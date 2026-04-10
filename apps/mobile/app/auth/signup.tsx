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
      router.replace("/(tabs)");
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
      <View style={styles.logoCorner}>
        <ProtocolsLogo size={38} />
      </View>
      <View style={styles.inner}>
        <Text style={styles.title}>Protocols</Text>
        <Text style={styles.subtitle}>Create your account</Text>

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
            style={[
              styles.button,
              (!canSubmit || loading) && styles.buttonDisabled,
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
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
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
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
