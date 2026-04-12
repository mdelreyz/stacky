import { Pressable, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { Supplement } from "@/lib/api";

import { styles } from "./styles";

export function SupplementSearchSection({
  catalogLoading,
  catalogCount,
  exactMatch,
  name,
  onChangeName,
  onClearName,
  trimmedName,
}: {
  catalogLoading: boolean;
  catalogCount: number;
  exactMatch: Supplement | null;
  name: string;
  onChangeName: (value: string) => void;
  onClearName: () => void;
  trimmedName: string;
}) {
  return (
    <>
      <View style={styles.searchCard}>
        <View style={styles.searchGlyph}>
          <FontAwesome name="search" size={16} color={colors.primaryDark} />
        </View>
        <View style={styles.searchBody}>
          <Text style={styles.label}>Supplement Name</Text>
          <Text style={styles.searchHint}>
            Start with at least two letters to search the curated catalog and your private supplements.
          </Text>
        </View>
      </View>

      <View style={styles.searchInputCard}>
        <TextInput
          style={styles.input}
          placeholder="e.g., Ashwagandha KSM-66"
          placeholderTextColor={colors.textPlaceholder}
          value={name}
          onChangeText={onChangeName}
          autoFocus
          autoCapitalize="words"
          returnKeyType="search"
        />
        {trimmedName ? (
          <Pressable
            style={({ pressed }) => [styles.clearButton, pressed && styles.iconButtonPressed]}
            onPress={onClearName}
            accessibilityRole="button"
            accessibilityLabel="Clear supplement search"
          >
            <FontAwesome name="times-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <FontAwesome name="database" size={12} color={colors.primaryDark} />
          <Text style={styles.metaPillText}>
            {catalogLoading ? "Loading catalog..." : `${catalogCount} items ready to browse`}
          </Text>
        </View>
        {exactMatch ? (
          <View style={styles.metaPill}>
            <FontAwesome name="check-circle" size={12} color={colors.success} />
            <Text style={styles.metaPillText}>Exact match found</Text>
          </View>
        ) : trimmedName ? (
          <View style={styles.metaPill}>
            <FontAwesome name="star-o" size={12} color={colors.warningDark} />
            <Text style={styles.metaPillText}>Create as user-created if missing</Text>
          </View>
        ) : null}
      </View>
    </>
  );
}
