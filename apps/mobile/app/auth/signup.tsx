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
import { Link, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

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
      <View style={styles.inner}>
        <Text style={styles.logo}>Protocols</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.form}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First name"
              placeholderTextColor="#adb5bd"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last name"
              placeholderTextColor="#adb5bd"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#adb5bd"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (8+ characters, 1 uppercase, 1 digit)"
            placeholderTextColor="#adb5bd"
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
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <Pressable>
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
    backgroundColor: "#f8f9fa",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: "#228be6",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#868e96",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#212529",
    backgroundColor: "#fff",
  },
  halfInput: {
    flex: 1,
  },
  error: {
    color: "#e03131",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#228be6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#868e96",
    fontSize: 14,
  },
  link: {
    color: "#228be6",
    fontSize: 14,
    fontWeight: "600",
  },
});
