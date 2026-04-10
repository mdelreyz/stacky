import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/lib/errors";

export default function ProfileLocationScreen() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    setLocationName(user?.location_name ?? "");
    setTimezone(user?.timezone ?? "UTC");
    setLatitude(user?.latitude != null ? String(user.latitude) : "");
    setLongitude(user?.longitude != null ? String(user.longitude) : "");
  }, [user]);

  const handleSave = async () => {
    if (!timezone.trim()) {
      showError("Enter a valid timezone.");
      return;
    }

    const latitudeValue = latitude.trim() ? Number(latitude) : null;
    const longitudeValue = longitude.trim() ? Number(longitude) : null;
    if ((latitudeValue == null) !== (longitudeValue == null)) {
      showError("Enter both latitude and longitude, or leave both empty.");
      return;
    }
    if (latitudeValue != null && (!Number.isFinite(latitudeValue) || latitudeValue < -90 || latitudeValue > 90)) {
      showError("Latitude must be between -90 and 90.");
      return;
    }
    if (longitudeValue != null && (!Number.isFinite(longitudeValue) || longitudeValue < -180 || longitudeValue > 180)) {
      showError("Longitude must be between -180 and 180.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        timezone: timezone.trim(),
        location_name: locationName.trim() || null,
        latitude: latitudeValue,
        longitude: longitudeValue,
      });
      router.back();
    } catch (error: any) {
      showError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await updateProfile({
        timezone: timezone.trim() || "UTC",
        location_name: null,
        latitude: null,
        longitude: null,
      });
      router.back();
    } catch (error: any) {
      showError(error.message || "Failed to clear saved location");
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader title="Location & UV" subtitle="Used for weather-based sunscreen guidance in Today" />

      <View style={styles.card}>
        <Text style={styles.label}>Location Name</Text>
        <TextInput
          style={styles.input}
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Barcelona"
        />

        <Text style={styles.label}>Timezone</Text>
        <TextInput
          style={styles.input}
          value={timezone}
          onChangeText={setTimezone}
          placeholder="Europe/Berlin"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Latitude</Text>
        <TextInput
          style={styles.input}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="41.3874"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Longitude</Text>
        <TextInput
          style={styles.input}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="2.1686"
          keyboardType="decimal-pad"
        />

        <Text style={styles.helper}>
          Save coordinates for your current or primary location and the Today tab will fetch UV guidance from a weather API.
        </Text>
      </View>

      <Pressable style={[styles.primaryButton, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving} accessibilityRole="button" accessibilityLabel="Save location">
        <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Location"}</Text>
      </Pressable>

      <Pressable style={[styles.secondaryButton, saving && styles.buttonDisabled]} onPress={handleClear} disabled={saving} accessibilityRole="button" accessibilityLabel="Clear location">
        <Text style={styles.secondaryText}>Clear Saved Location</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    fontSize: 16,
    color: colors.textPrimary,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 14,
    lineHeight: 18,
  },
  primaryButton: {
    marginHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: colors.dangerDark,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
