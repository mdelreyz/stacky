import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { Supplement } from "@/lib/api";

import { aiBadgeLabel, formatSupplementCategory, sourceLabel } from "./config";
import { styles } from "./styles";

export function SupplementSuggestionsSection({
  exactMatch,
  loading,
  onSubmit,
  suggestions,
  suggestionsLoading,
  trimmedName,
}: {
  exactMatch: Supplement | null;
  loading: boolean;
  onSubmit: () => void;
  suggestions: Supplement[];
  suggestionsLoading: boolean;
  trimmedName: string;
}) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        {suggestionsLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {trimmedName.length < 2 ? (
        <View style={styles.emptyGlassCard}>
          <FontAwesome name="keyboard-o" size={18} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Start typing to search the catalog</Text>
          <Text style={styles.emptyBody}>
            We&apos;ll surface supplements whose names contain your text, then let you jump into the best match.
          </Text>
        </View>
      ) : suggestions.length > 0 ? (
        suggestions.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.glassResultCard, pressed && styles.softPressedCard]}
            onPress={() => router.push(`/supplement/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
          >
            <View style={styles.resultIconWrap}>
              <FontAwesome name="flask" size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultMeta}>{formatSupplementCategory(item.category)}</Text>
              <View style={styles.resultBadgeRow}>
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceBadgeText}>{sourceLabel(item)}</Text>
                </View>
                <View style={[styles.sourceBadge, styles.aiBadge]}>
                  <Text style={[styles.sourceBadgeText, styles.aiBadgeText]}>{aiBadgeLabel(item)}</Text>
                </View>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={14} color={colors.textPlaceholder} />
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyGlassCard}>
          <FontAwesome name="magic" size={18} color={colors.warningDark} />
          <Text style={styles.emptyTitle}>No matching catalog entry yet</Text>
          <Text style={styles.emptyBody}>
            Press the primary button below and we&apos;ll create <Text style={styles.emptyBodyStrong}>{trimmedName}</Text> as a
            user-created supplement.
          </Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.onboardButton,
          (!trimmedName || loading) && styles.onboardButtonDisabled,
          pressed && trimmedName && !loading && styles.softPressed,
        ]}
        onPress={onSubmit}
        disabled={!trimmedName || loading}
        accessibilityRole="button"
        accessibilityLabel={exactMatch ? "Use matching supplement" : "Find or generate profile"}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name={exactMatch ? "arrow-right" : "magic"} size={16} color={colors.white} />
            <Text style={styles.onboardButtonText}>
              {exactMatch ? "Use Matching Supplement" : "Find or Generate Profile"}
            </Text>
          </>
        )}
      </Pressable>
    </>
  );
}
