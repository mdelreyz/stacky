import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={32} color={colors.textMuted} />
        </View>
        <Text style={styles.title}>
          {user ? `${user.first_name} ${user.last_name}` : "Profile"}
        </Text>
        <Text style={styles.subtitle}>
          {user?.email || "Manage your account and preferences"}
        </Text>
      </View>

      <View style={styles.card}>
        <Pressable style={styles.menuItem} onPress={() => router.push("/profile/edit")} accessibilityRole="button" accessibilityLabel="Edit Profile">
          <FontAwesome name="pencil" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Text style={styles.menuHint}>Update your name</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem} onPress={() => router.push("/profile/preferences")} accessibilityRole="button" accessibilityLabel="Goals and Preferences">
          <FontAwesome name="sliders" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Goals & Preferences</Text>
            <Text style={styles.menuHint}>
              Health goals, slot budgets, interaction mode, and AI constraints
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem} onPress={() => router.push("/profile/safety")} accessibilityRole="button" accessibilityLabel="Safety Check">
          <FontAwesome name="shield" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Safety Check</Text>
            <Text style={styles.menuHint}>
              Scan your active stack for known interactions
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem} onPress={() => router.push("/tracking")} accessibilityRole="button" accessibilityLabel="Adherence Stats">
          <FontAwesome name="line-chart" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Adherence Stats</Text>
            <Text style={styles.menuHint}>
              Completion rates, streaks, and per-item tracking
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Pressable style={styles.menuItem} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log Out">
          <FontAwesome name="sign-out" size={18} color={colors.danger} />
          <Text style={[styles.menuText, { color: colors.danger }]}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { padding: 20, paddingTop: 10, alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.gray, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuCopy: { flex: 1 },
  menuText: { flex: 1, fontSize: 16, color: colors.textPrimary },
  menuHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  separator: { height: 1, backgroundColor: colors.surface, marginLeft: 46 },
});
