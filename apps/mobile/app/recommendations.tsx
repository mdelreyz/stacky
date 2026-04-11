import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { preferences as prefsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import type { RecommendationResponse } from "@/lib/api";

const ITEM_TYPE_OPTIONS = [
  { value: "supplement", label: "Supplements", icon: "flask" as const },
  { value: "medication", label: "Medications", icon: "medkit" as const },
  { value: "therapy", label: "Modalities", icon: "heartbeat" as const },
  { value: "peptide", label: "Peptides", icon: "eyedropper" as const },
];

export default function RecommendationsScreen() {
  const [count, setCount] = useState("3");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["supplement"]);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [protocolName, setProtocolName] = useState("");

  const toggleType = (type: string) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type]
    );
  };

  const toggleItem = (catalogId: string) => {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(catalogId)) next.delete(catalogId);
      else next.add(catalogId);
      return next;
    });
  };

  const handleGetRecommendations = async () => {
    if (selectedTypes.length === 0) {
      showError("Select at least one item type.");
      return;
    }
    setLoading(true);
    setRecommendation(null);
    setSelectedItems(new Set());
    try {
      const result = await prefsApi.getRecommendations({
        count: parseInt(count, 10) || 3,
        item_types: selectedTypes,
      });
      setRecommendation(result);
      // Auto-select all recommended items
      setSelectedItems(new Set(result.items.map((item) => item.catalog_id)));
    } catch (error: any) {
      showError(error.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!recommendation || selectedItems.size === 0) return;

    setApplying(true);
    try {
      const itemsToApply = recommendation.items
        .filter((item) => selectedItems.has(item.catalog_id))
        .map((item) => ({
          catalog_id: item.catalog_id,
          item_type: item.item_type,
          ...(item.suggested_dosage ? { dosage_amount: parseFloat(item.suggested_dosage) || undefined } : {}),
          ...(item.suggested_window ? { take_window: item.suggested_window } : {}),
        }));

      await prefsApi.applyRecommendations({
        items: itemsToApply,
        protocol_name: protocolName.trim() || undefined,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to apply recommendations");
    } finally {
      setApplying(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="AI Recommendations"
          subtitle="Get personalized suggestions based on your goals and current stack"
        />

        {/* Request form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What to recommend</Text>
          <View style={styles.typeRow}>
            {ITEM_TYPE_OPTIONS.map((opt) => {
              const selected = selectedTypes.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.typeChip,
                    selected && styles.typeChipSelected,
                    pressed && styles.softPressed,
                  ]}
                  onPress={() => toggleType(opt.value)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ checked: selected }}
                >
                  <FontAwesome
                    name={opt.icon}
                    size={13}
                    color={selected ? colors.primaryDark : colors.textMuted}
                  />
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.countRow}>
            <Text style={styles.countLabel}>How many</Text>
            <TextInput
              style={styles.countInput}
              keyboardType="number-pad"
              value={count}
              onChangeText={setCount}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              loading && styles.buttonDisabled,
              pressed && !loading && styles.buttonPressed,
            ]}
            onPress={handleGetRecommendations}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Get recommendations"
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <FontAwesome name="magic" size={16} color={colors.white} />
                <Text style={styles.generateButtonText}>Get Recommendations</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Results */}
        {recommendation && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <Text style={styles.reasoning}>{recommendation.reasoning_summary}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Goals: {recommendation.goals_used.map((g) => snakeCaseToLabel(g)).join(", ") || "None set"}
                </Text>
                <Text style={styles.metaText}>
                  Budget: {recommendation.slot_budget} slots · {recommendation.items_excluded_current} already in stack
                </Text>
              </View>
            </View>

            {recommendation.items.map((item) => (
              <RecommendationCard
                key={item.catalog_id}
                item={item}
                selected={selectedItems.has(item.catalog_id)}
                onToggle={() => toggleItem(item.catalog_id)}
              />
            ))}

            {recommendation.items.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Apply Selection</Text>
                <Text style={styles.hint}>
                  {selectedItems.size} of {recommendation.items.length} items selected. Optionally name a protocol stack.
                </Text>
                <TextInput
                  style={styles.input}
                  value={protocolName}
                  onChangeText={setProtocolName}
                  placeholder="Protocol name (optional)"
                  placeholderTextColor={colors.textPlaceholder}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.applyButton,
                    (applying || selectedItems.size === 0) && styles.buttonDisabled,
                    pressed && !applying && selectedItems.size > 0 && styles.buttonPressed,
                  ]}
                  onPress={handleApply}
                  disabled={applying || selectedItems.size === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${selectedItems.size} item${selectedItems.size !== 1 ? "s" : ""} to my protocol`}
                >
                  {applying ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <FontAwesome name="check" size={16} color={colors.white} />
                      <Text style={styles.applyButtonText}>
                        Add {selectedItems.size} to My Protocol{selectedItems.size !== 1 ? "s" : ""}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </>
        )}
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1040 },
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
    color: colors.grayDark,
    marginBottom: 8,
  },
  reasoning: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(243,247,251,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  typeChipSelected: {
    backgroundColor: "rgba(234,242,248,0.94)",
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  typeChipTextSelected: {
    color: colors.primaryDark,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  countLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  countInput: {
    width: 64,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(248,251,255,0.84)",
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
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
    marginBottom: 12,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  softPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
