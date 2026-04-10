import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";

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
  const router = useRouter();
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
        style={({ pressed }) => [
          styles.item,
          isSelected && styles.itemSelected,
          pressed && styles.softPressed,
        ]}
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}${isSelected ? ", selected" : ""}`}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>
            {MUSCLE_LABELS[item.primary_muscle] || item.primary_muscle}
            {item.equipment !== "none" ? ` \u00b7 ${item.equipment}` : ""}
          </Text>
        </View>
        <View style={styles.itemActions}>
          {item.user_id && (
            <View style={styles.userBadge}>
              <FontAwesome name="user" size={11} color={colors.textSecondary} />
            </View>
          )}
          {isSelected ? (
            <View style={styles.selectedBadge}>
              <FontAwesome name="check" size={14} color={colors.textWhite} />
            </View>
          ) : (
            <View style={styles.unselectedBadge}>
              <FontAwesome name="plus" size={12} color={colors.primaryDark} />
            </View>
          )}
        </View>
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
          <Pressable
            onPress={() => setSearch("")}
            style={({ pressed }) => [styles.clearButton, pressed && styles.softPressed]}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <FontAwesome name="times" size={14} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <Pressable
        style={({ pressed }) => [styles.createBtn, pressed && styles.softPressed]}
        onPress={() => router.push("/exercise/create")}
        accessibilityRole="button"
        accessibilityLabel="Create custom exercise"
      >
        <FontAwesome name="plus" size={12} color={colors.primary} />
        <Text style={styles.createBtnText}>Create Custom Exercise</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 10 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251,253,255,0.76)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(236,242,247,0.86)",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "rgba(113,141,161,0.24)",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.6)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  createBtnText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  list: { flex: 1 },
  listContent: { paddingBottom: 24, gap: 10 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  itemSelected: {
    backgroundColor: "rgba(236,246,240,0.92)",
    borderColor: "rgba(95,156,120,0.24)",
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  itemActions: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 12 },
  userBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,245,249,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
  },
  selectedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
  },
  unselectedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(237,245,252,0.94)",
    borderWidth: 1,
    borderColor: "rgba(105,138,160,0.2)",
  },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
