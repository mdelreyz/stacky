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

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Login failed");
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
        <Text style={styles.subtitle}>
          Manage your health protocols intelligently
        </Text>

        <View style={styles.form}>
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
            placeholder="Password"
            placeholderTextColor="#adb5bd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.button,
              (!email.trim() || !password || loading) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!email.trim() || !password || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/signup" asChild>
              <Pressable>
                <Text style={styles.link}>Sign Up</Text>
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
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#212529",
    backgroundColor: "#fff",
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
