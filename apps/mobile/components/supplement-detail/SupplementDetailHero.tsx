import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { Supplement } from "@/lib/api";

export function SupplementDetailHero({
  supplement,
  onBack,
  onAddToProtocol,
  onDelete,
  deleting = false,
}: {
  supplement: Supplement;
  onBack: () => void;
  onAddToProtocol: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.controlPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {supplement.name}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroGlowLarge} />
        <View style={styles.heroGlowSmall} />
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{supplement.category}</Text>
          </View>
          <View style={[styles.categoryBadge, supplement.source === "catalog" ? styles.infoSubtleBadge : styles.neutralBadge]}>
            <Text style={[styles.categoryText, supplement.source === "catalog" ? styles.infoBadgeText : styles.neutralBadgeText]}>
              {supplement.source === "catalog" ? "Catalog" : "User-Created"}
            </Text>
          </View>
          {supplement.form ? (
            <View style={[styles.categoryBadge, styles.neutralBadge]}>
              <Text style={[styles.categoryText, styles.neutralBadgeText]}>{supplement.form}</Text>
            </View>
          ) : null}
          <ProfileStatusBadge supplement={supplement} />
        </View>

        {supplement.description ? (
          <Text style={styles.description}>{supplement.description}</Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
          onPress={onAddToProtocol}
          accessibilityRole="button"
          accessibilityLabel="Add to my protocol"
        >
          <FontAwesome name="plus-circle" size={16} color={colors.white} />
          <Text style={styles.primaryActionText}>Add to My Protocol</Text>
        </Pressable>

        {supplement.source === "user_created" && onDelete ? (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryAction,
              deleting && styles.secondaryActionDisabled,
              pressed && !deleting && styles.secondaryActionPressed,
            ]}
            onPress={onDelete}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Delete user-created supplement"
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <>
                <FontAwesome name="trash-o" size={14} color={colors.danger} />
                <Text style={styles.secondaryActionText}>Delete User-Created Supplement</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

function ProfileStatusBadge({ supplement }: { supplement: Supplement }) {
  if (supplement.ai_profile) {
    return (
      <View style={[styles.categoryBadge, styles.infoBadge]}>
        <FontAwesome name="magic" size={10} color={colors.primaryDark} />
        <Text style={[styles.categoryText, styles.infoBadgeText]}> AI Profile</Text>
      </View>
    );
  }

  if (supplement.ai_status === "generating") {
    return (
      <View style={[styles.categoryBadge, styles.infoSubtleBadge]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.categoryText, styles.infoBadgeText]}> Generating</Text>
      </View>
    );
  }

  if (supplement.ai_status === "failed") {
    return (
      <View style={[styles.categoryBadge, styles.dangerBadge]}>
        <FontAwesome name="warning" size={10} color={colors.danger} />
        <Text style={[styles.categoryText, styles.dangerBadgeText]}> Generation Failed</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  controlPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.95,
  },
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  spacer: {
    width: 42,
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(123,220,225,0.12)",
    top: -36,
    right: -18,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -24,
    left: -8,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232,245,239,0.86)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  neutralBadge: {
    backgroundColor: "rgba(243,247,251,0.92)",
  },
  neutralBadgeText: {
    color: colors.textSecondary,
  },
  infoBadge: {
    backgroundColor: "rgba(232,242,248,0.94)",
  },
  infoSubtleBadge: {
    backgroundColor: "rgba(236,242,248,0.94)",
  },
  infoBadgeText: {
    color: colors.primaryDark,
  },
  dangerBadge: {
    backgroundColor: "rgba(248,237,237,0.94)",
  },
  dangerBadgeText: {
    color: colors.danger,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 18,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  primaryActionPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
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
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(208,101,101,0.4)",
    backgroundColor: "rgba(255,255,255,0.55)",
    paddingVertical: 12,
    borderRadius: 18,
  },
  secondaryActionPressed: {
    transform: [{ scale: 0.992 }],
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  secondaryActionDisabled: {
    opacity: 0.7,
  },
  secondaryActionText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
});
