import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
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
                    <FontAwesome name="list-ol" size={11} color={colors.primaryDark} />{" "}
                    Default routine linked
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => handleDelete(loc.id)}
                style={({ pressed }) => [styles.deleteIcon, pressed && styles.softPressed]}
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
                style={({ pressed }) => [
                  styles.routineChip,
                  !formRoutineId && styles.routineChipSelected,
                  pressed && styles.softPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="No default routine"
                accessibilityState={{ selected: !formRoutineId }}
                onPress={() => setFormRoutineId(null)}
              >
                <Text
                  style={[styles.routineChipText, !formRoutineId && styles.routineChipTextSelected]}
                >
                  None
                </Text>
              </Pressable>
              {routines.map((r) => (
                <Pressable
                  key={r.id}
                  style={({ pressed }) => [
                    styles.routineChip,
                    formRoutineId === r.id && styles.routineChipSelected,
                    pressed && styles.softPressed,
                  ]}
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
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.softPressed]}
                onPress={() => setShowForm(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  saving && styles.saveBtnDisabled,
                  pressed && !saving && styles.buttonPressed,
                ]}
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
              style={({ pressed }) => [styles.addBtn, pressed && styles.softPressed]}
              onPress={() => setShowForm(true)}
              accessibilityRole="button"
              accessibilityLabel="Add Gym Location"
            >
              <FontAwesome name="plus" size={14} color={colors.primaryDark} />
              <Text style={styles.addBtnText}>Add Gym Location</Text>
            </Pressable>
          </View>
        )}
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1120 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  section: { paddingHorizontal: 20, marginTop: 16 },

  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  emptyHint: { fontSize: 12, color: colors.textMuted, textAlign: "center" },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
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
    borderWidth: 1,
    borderColor: "rgba(104,138,160,0.34)",
    borderStyle: "dashed",
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  addBtnText: { fontSize: 15, fontWeight: "600", color: colors.primaryDark },

  formSection: {
    marginTop: 16,
    gap: 6,
    marginHorizontal: 20,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: "rgba(248,251,255,0.84)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  coordRow: { flexDirection: "row", gap: 10 },
  routineScroll: { flexDirection: "row", marginTop: 4 },
  routineChip: {
    backgroundColor: "rgba(243,247,251,0.9)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  routineChipSelected: { borderColor: "rgba(104,138,160,0.34)", backgroundColor: "rgba(234,242,248,0.94)" },
  routineChipText: { fontSize: 13, color: colors.textSecondary },
  routineChipTextSelected: { color: colors.primaryDark, fontWeight: "600" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(248,251,255,0.72)",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: colors.textWhite },
  softPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
  buttonPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
});
