import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, type Href } from "expo-router";

import { colors } from "@/constants/Colors";

export function ProtocolsSectionHeader({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: Href;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionHref && actionLabel ? (
        <Link href={actionHref} asChild>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <FontAwesome name="plus" size={14} color={colors.primaryDark} />
            <Text style={styles.addButtonText}>{actionLabel}</Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  addButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  addButtonText: { color: colors.primaryDark, fontWeight: "700", fontSize: 13 },
});
