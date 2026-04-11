import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop />
      <FadeInView>
        <View style={styles.header}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.avatar}>
            <FontAwesome name="user" size={32} color={colors.textWhite} />
          </View>
          <Text style={styles.title}>
            {user ? `${user.first_name} ${user.last_name}` : "Profile"}
          </Text>
          <Text style={styles.subtitle}>
            {user?.email || "Manage your account and preferences"}
          </Text>
        </View>

        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={() => router.push("/profile/edit")}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
          <FontAwesome name="pencil" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Text style={styles.menuHint}>Update your name</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/profile/preferences")}
          accessibilityRole="button"
          accessibilityLabel="Goals and Preferences"
        >
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

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/goal-progress")}
          accessibilityRole="button"
          accessibilityLabel="Goal Progress"
        >
          <FontAwesome name="bullseye" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Goal Progress</Text>
            <Text style={styles.menuHint}>
              Per-goal adherence, supporting items, and journal correlation
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/profile/safety")}
          accessibilityRole="button"
          accessibilityLabel="Safety Check"
        >
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

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/profile/notifications")}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <FontAwesome name="bell" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuHint}>
              Reminders, quiet hours, and alert preferences
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/tracking")}
          accessibilityRole="button"
          accessibilityLabel="Adherence Stats"
        >
          <FontAwesome name="line-chart" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Adherence Stats</Text>
            <Text style={styles.menuHint}>
              Completion rates, streaks, and per-item tracking
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/weekly-digest")}
          accessibilityRole="button"
          accessibilityLabel="Weekly Digest"
        >
          <FontAwesome name="calendar" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Weekly Digest</Text>
            <Text style={styles.menuHint}>
              Adherence, journal, and exercise summary for the week
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/health-journal")}
          accessibilityRole="button"
          accessibilityLabel="Health Journal"
        >
          <FontAwesome name="book" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Health Journal</Text>
            <Text style={styles.menuHint}>
              Track energy, mood, sleep, symptoms, and daily notes
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          onPress={() => router.push("/profile/data-management")}
          accessibilityRole="button"
          accessibilityLabel="Data Management"
        >
          <FontAwesome name="download" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Data Management</Text>
            <Text style={styles.menuHint}>
              Export your stack, adherence, and journal data as CSV
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>
        </View>

        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={() => router.push("/profile/change-password")}
            accessibilityRole="button"
            accessibilityLabel="Change Password"
          >
          <FontAwesome name="lock" size={18} color={colors.textSecondary} />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Change Password</Text>
            <Text style={styles.menuHint}>Update your account password</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>

        <View style={styles.separator} />

        <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log Out"
          >
          <FontAwesome name="sign-out" size={18} color={colors.danger} />
          <Text style={[styles.menuText, { color: colors.danger }]}>Log Out</Text>
        </Pressable>

        <View style={styles.separator} />

        <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={() => router.push("/profile/delete-account")}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
          >
          <FontAwesome name="trash" size={18} color={colors.danger} />
          <View style={styles.menuCopy}>
            <Text style={[styles.menuText, { color: colors.danger }]}>Delete Account</Text>
            <Text style={styles.menuHint}>Permanently remove your account and data</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
        </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  header: {
    margin: 16,
    marginTop: 10,
    padding: 22,
    alignItems: "center",
    borderRadius: 26,
    backgroundColor: "rgba(54,94,130,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 3,
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.11)",
    top: -50,
    right: -18,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -20,
    left: -12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.textWhite },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.78)", marginTop: 4 },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.94,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  menuCopy: { flex: 1 },
  menuText: { flex: 1, fontSize: 16, color: colors.textPrimary },
  menuHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  separator: { height: 1, backgroundColor: colors.surface, marginLeft: 46 },
});
