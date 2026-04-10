import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
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

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            saving && styles.buttonDisabled,
            pressed && !saving && styles.buttonPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save location"
        >
          <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Location"}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            saving && styles.buttonDisabled,
            pressed && !saving && styles.secondaryButtonPressed,
          ]}
          onPress={handleClear}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Clear location"
        >
          <Text style={styles.secondaryText}>Clear Saved Location</Text>
        </Pressable>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 980 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
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
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(248,251,255,0.84)",
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
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.64)",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(208,101,101,0.34)",
  },
  secondaryText: {
    color: colors.dangerDark,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.992 }],
    backgroundColor: "rgba(255,255,255,0.76)",
  },
});
