import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { Supplement } from "@/lib/api";

export function SupplementDetailHero({
  supplement,
  onBack,
  onAddToProtocol,
}: {
  supplement: Supplement;
  onBack: () => void;
  onAddToProtocol: () => void;
}) {
  return (
    <>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {supplement.name}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{supplement.category}</Text>
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

      <Pressable style={styles.primaryAction} onPress={onAddToProtocol}>
        <FontAwesome name="plus-circle" size={16} color={colors.white} />
        <Text style={styles.primaryActionText}>Add to My Protocol</Text>
      </Pressable>
    </>
  );
}

function ProfileStatusBadge({ supplement }: { supplement: Supplement }) {
  if (supplement.ai_profile) {
    return (
      <View style={[styles.categoryBadge, styles.infoBadge]}>
        <FontAwesome name="magic" size={10} color={colors.primary} />
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
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
  },
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  spacer: {
    width: 34,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d3f9d8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },
  neutralBadge: {
    backgroundColor: colors.surface,
  },
  neutralBadgeText: {
    color: colors.textSecondary,
  },
  infoBadge: {
    backgroundColor: colors.primaryLight,
  },
  infoSubtleBadge: {
    backgroundColor: "#eef7ff",
  },
  infoBadgeText: {
    color: colors.primary,
  },
  dangerBadge: {
    backgroundColor: colors.dangerLight,
  },
  dangerBadgeText: {
    color: colors.danger,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
