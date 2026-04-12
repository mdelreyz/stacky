import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, type Href } from "expo-router";

import { colors } from "@/constants/Colors";

type IconName = ComponentProps<typeof FontAwesome>["name"];

const ACTIONS: Array<{
  href: Href;
  icon: IconName;
  label: string;
  hint: string;
}> = [
  {
    href: "/recommendations",
    icon: "magic",
    label: "Recommendations",
    hint: "See what to add, prune, or refill next.",
  },
  {
    href: "/wizard",
    icon: "comments",
    label: "Guided Wizard",
    hint: "Build a protocol path with AI assistance.",
  },
  {
    href: "/protocol-templates",
    icon: "book",
    label: "Protocol Library",
    hint: "Browse curated stacks and adopt with one tap.",
  },
];

export function ProtocolsActionLinks() {
  return (
    <View style={styles.aiButtonRow}>
      {ACTIONS.map((action) => (
        <Link key={action.label} href={action.href} asChild>
          <Pressable
            style={({ pressed }) => [styles.aiButton, pressed && styles.aiButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={styles.aiButtonIconWrap}>
              <FontAwesome name={action.icon} size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.aiButtonBody}>
              <Text style={styles.aiButtonText}>{action.label}</Text>
              <Text style={styles.aiButtonHint}>{action.hint}</Text>
            </View>
            <FontAwesome name="chevron-right" size={13} color={colors.textPlaceholder} />
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  aiButtonRow: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  aiButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  aiButtonIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    marginRight: 12,
  },
  aiButtonBody: {
    flex: 1,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  aiButtonHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
});
