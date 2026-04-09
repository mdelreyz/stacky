import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
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
          <FontAwesome name="user" size={32} color="#868e96" />
        </View>
        <Text style={styles.title}>
          {user ? `${user.first_name} ${user.last_name}` : "Profile"}
        </Text>
        <Text style={styles.subtitle}>
          {user?.email || "Manage your account and preferences"}
        </Text>
      </View>

      <View style={styles.card}>
        <Pressable style={styles.menuItem} onPress={() => router.push("/profile/location")}>
          <FontAwesome name="map-marker" size={18} color="#495057" />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Location & UV Guidance</Text>
            <Text style={styles.menuHint}>
              {user?.location_name
                ? `${user.location_name} · ${user.timezone}`
                : "Save a location to enable weather-based sunscreen guidance"}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem} onPress={() => router.push("/profile/preferences")}>
          <FontAwesome name="sliders" size={18} color="#495057" />
          <View style={styles.menuCopy}>
            <Text style={styles.menuText}>Goals & Preferences</Text>
            <Text style={styles.menuHint}>
              Health goals, slot budgets, interaction mode, and AI constraints
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem}>
          <FontAwesome name="bell" size={18} color="#495057" />
          <Text style={styles.menuText}>Notification Preferences</Text>
          <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem}>
          <FontAwesome name="clock-o" size={18} color="#495057" />
          <Text style={styles.menuText}>Take Window Times</Text>
          <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem}>
          <FontAwesome name="shield" size={18} color="#495057" />
          <Text style={styles.menuText}>Safety Check</Text>
          <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.menuItem}>
          <FontAwesome name="line-chart" size={18} color="#495057" />
          <Text style={styles.menuText}>Adherence Stats</Text>
          <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={18} color="#e03131" />
          <Text style={[styles.menuText, { color: "#e03131" }]}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { padding: 20, paddingTop: 10, alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#212529" },
  subtitle: { fontSize: 14, color: "#6c757d", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
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
  menuText: { flex: 1, fontSize: 16, color: "#212529" },
  menuHint: { fontSize: 12, color: "#868e96", marginTop: 4 },
  separator: { height: 1, backgroundColor: "#f1f3f5", marginLeft: 46 },
});
