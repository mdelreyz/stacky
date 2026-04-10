import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { gymLocations as gymApi, workoutRoutines as routinesApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { GymLocation, WorkoutRoutineListItem } from "@/lib/api";

export default function GymLocationManageScreen() {
  const [locations, setLocations] = useState<GymLocation[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutineListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState("100");
  const [formRoutineId, setFormRoutineId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [locs, rts] = await Promise.all([
        gymApi.list(),
        routinesApi.list({ active_only: true }),
      ]);
      setLocations(locs);
      setRoutines(rts.items);
    } catch {
      showError("Failed to load gym locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    if (!formName.trim() || !formLat || !formLng) {
      showError("Name and coordinates are required");
      return;
    }
    setSaving(true);
    try {
      await gymApi.create({
        name: formName.trim(),
        latitude: Number(formLat),
        longitude: Number(formLng),
        radius_meters: Number(formRadius) || 100,
        default_routine_id: formRoutineId || undefined,
      });
      setShowForm(false);
      setFormName("");
      setFormLat("");
      setFormLng("");
      setFormRadius("100");
      setFormRoutineId(null);
      await loadData();
    } catch (error: any) {
      showError(error?.message || "Failed to save gym location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await gymApi.delete(id);
      await loadData();
    } catch {
      showError("Failed to delete gym location");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <FlowScreenHeader
        title="Gym Locations"
        subtitle="GPS-linked locations that auto-load your routine"
      />

      {/* Location list */}
      <View style={styles.section}>
        {locations.length === 0 && !showForm && (
          <View style={styles.emptyCard}>
            <FontAwesome name="map-marker" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No gym locations saved</Text>
            <Text style={styles.emptyHint}>
              Add a location to auto-load routines when you arrive
            </Text>
          </View>
        )}

        {locations.map((loc) => (
          <View key={loc.id} style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <Text style={styles.locationCoords}>
                {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} \u00b7 {loc.radius_meters}m radius
              </Text>
              {loc.default_routine_id && (
                <Text style={styles.locationRoutine}>
                  <FontAwesome name="list-ol" size={11} color={colors.primary} />{" "}
                  Default routine linked
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => handleDelete(loc.id)}
              style={styles.deleteIcon}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${loc.name}`}
            >
              <FontAwesome name="trash-o" size={16} color={colors.danger} />
            </Pressable>
          </View>
        ))}
      </View>

      {/* Add form */}
      {showForm ? (
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>New Gym Location</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formName}
            onChangeText={setFormName}
            placeholder="e.g. Gold's Gym Downtown"
            placeholderTextColor={colors.textPlaceholder}
          />

          <View style={styles.coordRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={formLat}
                onChangeText={setFormLat}
                placeholder="34.0522"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={formLng}
                onChangeText={setFormLng}
                placeholder="-118.2437"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Radius (meters)</Text>
          <TextInput
            style={styles.input}
            value={formRadius}
            onChangeText={setFormRadius}
            placeholder="100"
            placeholderTextColor={colors.textPlaceholder}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Default Routine (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routineScroll}>
            <Pressable
              style={[styles.routineChip, !formRoutineId && styles.routineChipSelected]}
              accessibilityRole="button"
              accessibilityLabel="No default routine"
              accessibilityState={{ selected: !formRoutineId }}
              onPress={() => setFormRoutineId(null)}
            >
              <Text style={[styles.routineChipText, !formRoutineId && styles.routineChipTextSelected]}>
                None
              </Text>
            </Pressable>
            {routines.map((r) => (
              <Pressable
                key={r.id}
                style={[styles.routineChip, formRoutineId === r.id && styles.routineChipSelected]}
                accessibilityRole="button"
                accessibilityLabel={`Default routine: ${r.name}`}
                accessibilityState={{ selected: formRoutineId === r.id }}
                onPress={() => setFormRoutineId(r.id)}
              >
                <Text
                  style={[styles.routineChipText, formRoutineId === r.id && styles.routineChipTextSelected]}
                  numberOfLines={1}
                >
                  {r.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setShowForm(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save gym location"
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
            accessibilityRole="button"
            accessibilityLabel="Add Gym Location"
          >
            <FontAwesome name="plus" size={14} color={colors.primary} />
            <Text style={styles.addBtnText}>Add Gym Location</Text>
          </Pressable>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  section: { paddingHorizontal: 20, marginTop: 16 },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  emptyHint: { fontSize: 12, color: colors.textMuted, textAlign: "center" },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  locationCoords: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  locationRoutine: { fontSize: 12, color: colors.primary, marginTop: 4 },
  deleteIcon: { padding: 8 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 14,
  },
  addBtnText: { fontSize: 15, fontWeight: "600", color: colors.primary },

  formSection: { paddingHorizontal: 20, marginTop: 16, gap: 6 },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  coordRow: { flexDirection: "row", gap: 10 },
  routineScroll: { flexDirection: "row", marginTop: 4 },
  routineChip: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  routineChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  routineChipText: { fontSize: 13, color: colors.textSecondary },
  routineChipTextSelected: { color: colors.primary, fontWeight: "600" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: colors.textWhite },
});
