import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { getToken } from "@/lib/api";
import { showError } from "@/lib/errors";

interface ExportOption {
  key: string;
  title: string;
  description: string;
  icon: string;
  endpoint: string;
  filename: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    key: "stack",
    title: "Current Stack",
    description: "All active and inactive supplements, medications, therapies, and peptides with dosage and schedule details",
    icon: "flask",
    endpoint: "/api/v1/users/me/export/stack",
    filename: "stack_export.csv",
  },
  {
    key: "adherence",
    title: "Adherence History",
    description: "Complete adherence log with timestamps, skip reasons, dosage snapshots, and protocol associations",
    icon: "check-square-o",
    endpoint: "/api/v1/users/me/export/adherence",
    filename: "adherence_export.csv",
  },
  {
    key: "journal",
    title: "Health Journal",
    description: "Daily energy, mood, sleep, and stress ratings with symptoms and notes",
    icon: "book",
    endpoint: "/api/v1/users/me/export/journal",
    filename: "journal_export.csv",
  },
];

async function downloadCsv(endpoint: string, filename: string) {
  const token = getToken();
  if (!token) {
    showError("Not authenticated");
    return;
  }

  if (Platform.OS === "web") {
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      showError("Failed to download export");
    }
  } else {
    // Native — open in browser/share sheet
    try {
      await Linking.openURL(endpoint);
    } catch {
      showError("Could not open export link");
    }
  }
}

export default function DataManagementScreen() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (option: ExportOption) => {
    setDownloading(option.key);
    try {
      await downloadCsv(option.endpoint, option.filename);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Data Management"
          subtitle="Export your health data as CSV files"
        />

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <FontAwesome name="shield" size={18} color={colors.primaryDark} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoTitle}>Your data, your control</Text>
            <Text style={styles.infoText}>
              Export any dataset below as a CSV file. Your data stays on-device until you choose to share it. All exports include full history with no time limit.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Export Data</Text>

        {EXPORT_OPTIONS.map((option) => {
          const isDownloading = downloading === option.key;
          return (
            <Pressable
              key={option.key}
              style={({ pressed }) => [
                styles.exportCard,
                pressed && !isDownloading && styles.exportCardPressed,
              ]}
              onPress={() => void handleExport(option)}
              disabled={isDownloading}
              accessibilityRole="button"
              accessibilityLabel={`Export ${option.title}`}
            >
              <View style={styles.exportIconWrap}>
                <FontAwesome name={option.icon as any} size={18} color={colors.primaryDark} />
              </View>
              <View style={styles.exportBody}>
                <Text style={styles.exportTitle}>{option.title}</Text>
                <Text style={styles.exportDescription}>{option.description}</Text>
              </View>
              {isDownloading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={styles.downloadBadge}>
                  <FontAwesome name="download" size={14} color={colors.primary} />
                  <Text style={styles.downloadBadgeText}>CSV</Text>
                </View>
              )}
            </Pressable>
          );
        })}

        <Text style={styles.sectionHeader}>Data Format</Text>

        <View style={styles.formatCard}>
          {[
            { label: "Format", value: "CSV (comma-separated values)" },
            { label: "Encoding", value: "UTF-8" },
            { label: "Compatible with", value: "Excel, Google Sheets, Numbers, any spreadsheet app" },
            { label: "Time zone", value: "UTC timestamps" },
          ].map((row) => (
            <View key={row.label} style={styles.formatRow}>
              <Text style={styles.formatLabel}>{row.label}</Text>
              <Text style={styles.formatValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 36, position: "relative" },
  backdrop: { top: -48, height: 1040 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(234,242,248,0.88)",
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBody: { flex: 1 },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryDark,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    marginHorizontal: 18,
    marginBottom: 12,
    marginTop: 4,
  },
  exportCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  exportCardPressed: { opacity: 0.94, transform: [{ scale: 0.988 }] },
  exportIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  exportBody: { flex: 1, marginRight: 12 },
  exportTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  exportDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  downloadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  downloadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  formatCard: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  formatRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,236,242,0.6)",
  },
  formatLabel: {
    width: 110,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  formatValue: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
