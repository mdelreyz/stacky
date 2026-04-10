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

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { preferences as prefsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import type { RecommendationResponse, RecommendedItem } from "@/lib/api";

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
    <ScrollView style={styles.container}>
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
                style={[styles.typeChip, selected && styles.typeChipSelected]}
                onPress={() => toggleType(opt.value)}
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
          style={[styles.generateButton, loading && styles.buttonDisabled]}
          onPress={handleGetRecommendations}
          disabled={loading}
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
                style={[styles.applyButton, (applying || selectedItems.size === 0) && styles.buttonDisabled]}
                onPress={handleApply}
                disabled={applying || selectedItems.size === 0}
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

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function RecommendationCard({
  item,
  selected,
  onToggle,
}: {
  item: RecommendedItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const typeIcons: Record<string, string> = {
    supplement: "flask",
    medication: "medkit",
    therapy: "heartbeat",
    peptide: "eyedropper",
  };

  return (
    <Pressable
      style={[styles.recCard, selected && styles.recCardSelected]}
      onPress={onToggle}
    >
      <View style={styles.recHeader}>
        <FontAwesome
          name={(typeIcons[item.item_type] ?? "circle") as any}
          size={14}
          color={selected ? colors.primary : colors.textMuted}
        />
        <Text style={styles.recName}>{item.name}</Text>
        <FontAwesome
          name={selected ? "check-square-o" : "square-o"}
          size={20}
          color={selected ? colors.primary : colors.border}
        />
      </View>
      <View style={styles.recBadgeRow}>
        <View style={styles.recBadge}>
          <Text style={styles.recBadgeText}>{snakeCaseToLabel(item.item_type)}</Text>
        </View>
        <View style={styles.recBadge}>
          <Text style={styles.recBadgeText}>{snakeCaseToLabel(item.category)}</Text>
        </View>
        <View style={[styles.recBadge, styles.rankBadge]}>
          <Text style={styles.rankBadgeText}>#{item.priority_rank}</Text>
        </View>
      </View>
      <Text style={styles.recReason}>{item.reason}</Text>
      {(item.suggested_dosage || item.suggested_window) && (
        <Text style={styles.recMeta}>
          {[
            item.suggested_dosage && `Dosage: ${item.suggested_dosage}`,
            item.suggested_window && `Window: ${snakeCaseToLabel(item.suggested_window)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  typeChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "600",
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
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSecondary,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
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
    marginBottom: 12,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  recCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLighter,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  recBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  recBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  rankBadge: {
    backgroundColor: colors.primaryLight,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  recReason: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
});
