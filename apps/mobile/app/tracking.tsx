import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams } from "expo-router";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { tracking as trackingApi } from "@/lib/api";
import { formatIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";
import type { TrackingOverview } from "@/lib/api";

export default function TrackingScreen() {
  const { endDate } = useLocalSearchParams<{ endDate?: string }>();
  const [overview, setOverview] = useState<TrackingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemTypeFilter, setItemTypeFilter] = useState<"supplement" | "medication" | "therapy" | null>(null);

  useEffect(() => {
    let cancelled = false;
    trackingApi
      .overview({ days: 14, endDate, itemType: itemTypeFilter ?? undefined })
      .then((result) => {
        if (!cancelled) {
          setOverview(result);
        }
      })
      .catch((error: any) => {
        console.error("Failed to load tracking overview", error);
        showError(error.message || "Failed to load tracking overview");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [endDate, itemTypeFilter]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  if (!overview) {
    return (
      <View style={styles.centered}>
        <Text>Tracking overview unavailable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="Tracking"
        subtitle={`${formatIsoDate(overview.end_date)} snapshot`}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Execution Overview</Text>
        <View style={styles.filterRow}>
          <FilterChip label="All" selected={itemTypeFilter === null} onPress={() => setItemTypeFilter(null)} />
          <FilterChip
            label="Supplements"
            selected={itemTypeFilter === "supplement"}
            onPress={() => setItemTypeFilter("supplement")}
          />
          <FilterChip
            label="Medications"
            selected={itemTypeFilter === "medication"}
            onPress={() => setItemTypeFilter("medication")}
          />
          <FilterChip
            label="Modalities"
            selected={itemTypeFilter === "therapy"}
            onPress={() => setItemTypeFilter("therapy")}
          />
        </View>
        <View style={styles.summaryGrid}>
          <SummaryMetric label="Completion" value={`${Math.round(overview.completion_rate * 100)}%`} />
          <SummaryMetric label="Streak" value={`${overview.current_streak_days} days`} />
          <SummaryMetric label="Taken" value={String(overview.taken_count)} />
          <SummaryMetric label="Pending" value={String(overview.pending_count)} />
        </View>
        <Text style={styles.summaryRange}>
          {formatIsoDate(overview.start_date)} to {formatIsoDate(overview.end_date)}
        </Text>
      </View>

      <SectionCard title="Suggestions" icon="compass">
        {overview.suggestions.length === 0 ? (
          <Text style={styles.emptyText}>No change suggestions yet. Keep logging completions to surface patterns.</Text>
        ) : (
          overview.suggestions.map((suggestion, index) => (
            <View key={`${suggestion.item_type}-${suggestion.item_id ?? "overall"}-${index}`} style={styles.listRow}>
              <Text style={styles.listTitle}>{suggestion.headline}</Text>
              <Text style={styles.listBody}>{suggestion.recommendation}</Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Lowest Adherence Items" icon="exclamation-circle">
        {overview.item_stats.length === 0 ? (
          <Text style={styles.emptyText}>No scheduled items in this window.</Text>
        ) : (
          overview.item_stats.slice(0, 8).map((item) => (
            <View key={`${item.item_type}-${item.item_id}`} style={styles.listRow}>
              <Text style={styles.listTitle}>{item.item_name}</Text>
              <Text style={styles.listMeta}>
                {Math.round(item.completion_rate * 100)}% completion · {item.taken_count}/{item.scheduled_count} taken ·{" "}
                {item.take_window.replace(/_/g, " ")}
              </Text>
              {item.regimes.length > 0 ? <Text style={styles.listBody}>Regime: {item.regimes.join(", ")}</Text> : null}
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Recent Activity" icon="clock-o">
        {overview.recent_events.length === 0 ? (
          <Text style={styles.emptyText}>No completion events recorded yet.</Text>
        ) : (
          overview.recent_events.map((event) => (
            <View key={`${event.item_type}-${event.item_id}-${event.scheduled_at}`} style={styles.listRow}>
              <Text style={styles.listTitle}>
                {event.item_name} · {event.status === "taken" ? "Taken" : "Skipped"}
              </Text>
              <Text style={styles.listMeta}>{formatEventTimestamp(event.taken_at ?? event.scheduled_at)}</Text>
              {event.take_window ? (
                <Text style={styles.listBody}>Window: {event.take_window.replace(/_/g, " ")}</Text>
              ) : null}
              {event.regimes.length > 0 ? <Text style={styles.listBody}>Regime: {event.regimes.join(", ")}</Text> : null}
              {event.skip_reason ? <Text style={styles.listBody}>Reason: {event.skip_reason}</Text> : null}
            </View>
          ))
        )}
      </SectionCard>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.filterChip, selected && styles.filterChipSelected]} onPress={onPress}>
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ComponentProps<typeof FontAwesome>["name"];
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FontAwesome name={icon} size={15} color="#1c7ed6" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function formatEventTimestamp(value: string): string {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f3f5",
  },
  filterChipSelected: {
    backgroundColor: "#e7f5ff",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#495057",
  },
  filterChipTextSelected: {
    color: "#1c7ed6",
  },
  metricCard: {
    flexBasis: "47%",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c7ed6",
  },
  metricLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  summaryRange: {
    fontSize: 12,
    color: "#868e96",
    marginTop: 14,
  },
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#343a40",
  },
  listRow: {
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212529",
  },
  listMeta: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  listBody: {
    fontSize: 13,
    color: "#495057",
    lineHeight: 18,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#868e96",
    lineHeight: 18,
  },
});
