import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { protocolTemplates as templatesApi } from "@/lib/api";
import { getTakeWindowLabel } from "@/lib/schedule";
import { showError } from "@/lib/errors";
import type { ProtocolTemplate } from "@/lib/api";

const TYPE_ICONS: Record<string, string> = {
  supplement: "cube",
  medication: "medkit",
  therapy: "hand-paper-o",
  peptide: "flask",
};

const TYPE_COLORS: Record<string, string> = {
  supplement: colors.primary,
  medication: colors.accent,
  therapy: colors.success,
  peptide: colors.warning,
};

export default function ProtocolTemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<ProtocolTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [adopting, setAdopting] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!id) return;
    try {
      const data = await templatesApi.get(id);
      setTemplate(data);
    } catch (error: any) {
      showError(error.message || "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadTemplate();
    }, [loadTemplate])
  );

  const handleAdopt = async () => {
    if (!template) return;
    setAdopting(true);
    try {
      const result = await templatesApi.adopt(template.id);
      Alert.alert(
        "Protocol Created",
        `${result.message}\n\n${result.items_created} new items added, ${result.items_existing} already in your stack.`,
        [
          { text: "View Protocol", onPress: () => router.push(`/protocol/${result.protocol_id}` as any) },
          { text: "OK", onPress: () => router.back() },
        ]
      );
    } catch (error: any) {
      showError(error.message || "Failed to adopt template");
    } finally {
      setAdopting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!template) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Template not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title={template.name} subtitle={template.description ?? ""} />

        {/* Meta row */}
        <View style={styles.metaRow}>
          {template.difficulty && (
            <View style={styles.metaChip}>
              <FontAwesome name="signal" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{template.difficulty}</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <FontAwesome name="cubes" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {template.items?.length ?? 0} items
            </Text>
          </View>
          {template.adoption_count > 0 && (
            <View style={styles.metaChip}>
              <FontAwesome name="users" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{template.adoption_count} adopted</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <View style={styles.tagRow}>
            {template.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Included Items</Text>
          {template.items?.map((item, idx) => {
            const icon = TYPE_ICONS[item.type] ?? "cube";
            const color = TYPE_COLORS[item.type] ?? colors.primary;
            return (
              <View
                key={idx}
                style={[
                  styles.itemRow,
                  idx < (template.items?.length ?? 0) - 1 && styles.itemRowBorder,
                ]}
              >
                <View style={[styles.itemIcon, { backgroundColor: color + "14" }]}>
                  <FontAwesome name={icon as any} size={14} color={color} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.catalog_name}</Text>
                  <View style={styles.itemDetails}>
                    {item.dosage && (
                      <Text style={styles.itemDetail}>{item.dosage}</Text>
                    )}
                    {item.take_window && (
                      <Text style={styles.itemDetail}>
                        {getTakeWindowLabel(item.take_window as any)}
                      </Text>
                    )}
                    {item.frequency && (
                      <Text style={styles.itemDetail}>{item.frequency}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={[styles.typeBadgeText, { color }]}>{item.type}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Adopt button */}
        <Pressable
          style={({ pressed }) => [
            styles.adoptButton,
            adopting && styles.adoptButtonDisabled,
            pressed && !adopting && styles.adoptButtonPressed,
          ]}
          onPress={handleAdopt}
          disabled={adopting}
          accessibilityRole="button"
          accessibilityLabel={`Adopt ${template.name}`}
        >
          {adopting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <FontAwesome name="plus-circle" size={18} color={colors.white} />
              <Text style={styles.adoptButtonText}>Adopt This Protocol</Text>
            </>
          )}
        </Pressable>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 28, position: "relative" },
  backdrop: { top: -48, height: 900 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },
  errorText: { fontSize: 15, color: colors.textMuted },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
  },
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemDetails: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  itemDetail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  adoptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  adoptButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  adoptButtonDisabled: {
    opacity: 0.6,
  },
  adoptButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
