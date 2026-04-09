import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { exercises as exercisesApi } from "@/lib/api";
import type { Exercise } from "@/lib/api";

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", forearms: "Forearms", quadriceps: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves", core: "Core", full_body: "Full Body", cardio: "Cardio",
};

const EQUIPMENT_ICONS: Record<string, string> = {
  barbell: "circle", dumbbell: "circle-o", cable: "link", machine: "cog",
  bodyweight: "male", kettlebell: "circle", none: "minus",
};

export function ExerciseSearchPicker({
  onSelect,
  selectedIds = [],
}: {
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await exercisesApi.list({ search: q || undefined, page_size: 50 } as any);
      setResults(res.items);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, doSearch]);

  const renderItem = ({ item }: { item: Exercise }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <Pressable
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => onSelect(item)}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>
            {MUSCLE_LABELS[item.primary_muscle] || item.primary_muscle}
            {item.equipment !== "none" ? ` \u00b7 ${item.equipment}` : ""}
          </Text>
        </View>
        {isSelected && <FontAwesome name="check" size={16} color={colors.success} />}
        {item.user_id && <FontAwesome name="user" size={12} color={colors.textMuted} style={{ marginLeft: 6 }} />}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <FontAwesome name="search" size={14} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <FontAwesome name="times" size={14} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  list: { flex: 1 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemSelected: { backgroundColor: colors.successLight },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "500", color: colors.textPrimary },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
