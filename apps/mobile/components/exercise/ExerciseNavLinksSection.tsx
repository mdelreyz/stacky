import type { ComponentProps } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";

type ExerciseNavLinksSectionProps = {
  onOpenStats: () => void;
  onManageRegimes: () => void;
  onManageGyms: () => void;
  onCreateCustomExercise: () => void;
};

export function ExerciseNavLinksSection({
  onOpenStats,
  onManageRegimes,
  onManageGyms,
  onCreateCustomExercise,
}: ExerciseNavLinksSectionProps) {
  return (
    <View style={styles.section}>
      <NavLink
        label="Detailed Stats & Progress"
        icon="bar-chart"
        onPress={onOpenStats}
      />
      <NavLink label="Manage Regimes" icon="calendar" onPress={onManageRegimes} />
      <NavLink label="Gym Locations" icon="map-marker" onPress={onManageGyms} />
      <NavLink
        label="Create Custom Exercise"
        icon="plus-square-o"
        onPress={onCreateCustomExercise}
      />
    </View>
  );
}

function NavLink({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof FontAwesome>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navLink, pressed && styles.pressedCard]}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <FontAwesome name={icon} size={16} color={colors.primary} />
      <Text style={styles.navLinkText}>{label}</Text>
      <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  navLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  navLinkText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  },
  pressedCard: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
