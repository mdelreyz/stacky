import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";

export function FlowScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.heroGlowLarge} />
      <View style={styles.heroGlowSmall} />
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <FontAwesome name="arrow-left" size={18} color={colors.textWhite} />
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginTop: 10,
    padding: 20,
    gap: 12,
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
    top: -56,
    right: -18,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -20,
    left: -10,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.975 }] },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textWhite,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
    lineHeight: 20,
  },
});
