import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import { colors } from "@/constants/Colors";

export function EmptyDayCard() {
  return (
    <View style={styles.card}>
      <FontAwesome name="compass" size={32} color={colors.primaryDark} />
      <Text style={styles.title}>Nothing scheduled yet</Text>
      <Text style={styles.subtitle}>
        Build your first protocol stack to see your personalized daily plan
        here.
      </Text>

      <View style={styles.actions}>
        <Link href="/wizard" asChild>
          <Pressable
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Build with AI wizard"
          >
            <FontAwesome name="comments" size={14} color={colors.white} />
            <Text style={styles.primaryActionText}>AI Wizard</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/protocols" asChild>
          <Pressable
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Browse catalog"
          >
            <FontAwesome name="search" size={13} color={colors.primaryDark} />
            <Text style={styles.secondaryActionText}>Browse Catalog</Text>
          </Pressable>
        </Link>

        <Link href="/supplement/add" asChild>
          <Pressable
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add supplement"
          >
            <FontAwesome name="plus-circle" size={13} color={colors.primaryDark} />
            <Text style={styles.secondaryActionText}>Add Supplement</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 6,
  },
  actions: {
    width: "100%",
    gap: 10,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  pressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
