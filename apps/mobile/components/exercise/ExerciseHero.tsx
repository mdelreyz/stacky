import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";
import type { GymLocationMatch } from "@/lib/api";

type ExerciseHeroProps = {
  sessionCount?: number;
  gymMatch: GymLocationMatch | null;
  onPressGymBanner: () => void;
};

export function ExerciseHero({ sessionCount, gymMatch, onPressGymBanner }: ExerciseHeroProps) {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.heroGlowLarge} />
        <View style={styles.heroGlowSmall} />
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Exercise</Text>
          <Text style={styles.subtitle}>
            Routines, live gym starts, session history, and weekly output in one calm control
            surface.
          </Text>
        </View>
        {sessionCount != null ? (
          <View style={styles.headerPill}>
            <Text style={styles.headerPillValue}>{sessionCount}</Text>
            <Text style={styles.headerPillLabel}>sessions</Text>
          </View>
        ) : null}
      </View>

      {gymMatch?.matched && gymMatch.gym_location ? (
        <Pressable
          style={({ pressed }) => [styles.gymBanner, pressed && styles.pressedCard]}
          accessibilityRole="button"
          accessibilityLabel={
            gymMatch.default_routine
              ? `You're at ${gymMatch.gym_location.name}. Tap to start ${gymMatch.default_routine.name}`
              : `You're at ${gymMatch.gym_location.name}. Tap to start a workout`
          }
          onPress={onPressGymBanner}
        >
          <FontAwesome name="map-marker" size={18} color={colors.textWhite} />
          <View style={styles.gymBannerCopy}>
            <Text style={styles.gymBannerTitle}>You're at {gymMatch.gym_location.name}</Text>
            <Text style={styles.gymBannerSub}>
              {gymMatch.default_routine
                ? `Tap to start ${gymMatch.default_routine.name}`
                : "Tap to start a workout"}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textWhite} />
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    margin: 16,
    marginTop: 10,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
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
    backgroundColor: "rgba(123,220,225,0.12)",
    bottom: -18,
    left: -10,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textWhite,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
    lineHeight: 20,
  },
  headerPill: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    minWidth: 78,
  },
  headerPillValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textWhite,
  },
  headerPillLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  gymBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(54,94,130,0.92)",
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 2,
  },
  gymBannerCopy: {
    flex: 1,
  },
  gymBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textWhite,
  },
  gymBannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
  },
  pressedCard: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
