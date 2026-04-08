import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { supplements as supplementsApi, userSupplements as userSupApi } from "@/lib/api";
import type { Supplement, UserSupplement } from "@/lib/api";

export default function ProtocolsScreen() {
  const [catalog, setCatalog] = useState<Supplement[]>([]);
  const [mySupplements, setMySupplements] = useState<UserSupplement[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [catalogRes, myRes] = await Promise.all([
        supplementsApi.list({ search: search || undefined }),
        userSupApi.list(),
      ]);
      setCatalog(catalogRes.items);
      setMySupplements(myRes.items);
    } catch (e) {
      console.error("Failed to fetch:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Protocols</Text>
        <Text style={styles.subtitle}>
          Supplements, therapies, and stacks
        </Text>
      </View>

      {/* My Active Supplements */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Active Supplements ({mySupplements.length})
        </Text>
        <Link href="/supplement/add" asChild>
          <Pressable style={styles.addButton}>
            <FontAwesome name="plus" size={14} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </Link>
      </View>

      {mySupplements.length === 0 ? (
        <View style={styles.emptyCard}>
          <FontAwesome name="flask" size={40} color="#dee2e6" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No supplements added yet</Text>
          <Text style={styles.emptyHint}>
            Tap "Add" to onboard your first supplement with AI-powered insights.
          </Text>
        </View>
      ) : (
        mySupplements.map((us) => (
          <Link key={us.id} href={`/supplement/${us.supplement.id}`} asChild>
            <Pressable style={styles.supplementCard}>
              <View style={styles.supplementInfo}>
                <Text style={styles.supplementName}>{us.supplement.name}</Text>
                <Text style={styles.supplementMeta}>
                  {us.dosage_amount}
                  {us.dosage_unit} · {us.frequency.replace("_", " ")} ·{" "}
                  {us.take_window.replace(/_/g, " ")}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
            </Pressable>
          </Link>
        ))
      )}

      {/* Supplement Catalog */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Supplement Catalog</Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={14} color="#adb5bd" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search supplements..."
          placeholderTextColor="#adb5bd"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {catalog.map((s) => (
        <Link key={s.id} href={`/supplement/${s.id}`} asChild>
          <Pressable style={styles.catalogCard}>
            <View style={styles.catalogInfo}>
              <Text style={styles.catalogName}>{s.name}</Text>
              <Text style={styles.catalogCategory}>{s.category}</Text>
            </View>
            {s.ai_profile ? (
              <View style={styles.aiBadge}>
                <FontAwesome name="magic" size={10} color="#228be6" />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            ) : null}
            <FontAwesome name="chevron-right" size={14} color="#adb5bd" />
          </Pressable>
        </Link>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "700", color: "#212529" },
  subtitle: { fontSize: 14, color: "#6c757d", marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#495057" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#228be6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  emptyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: { fontSize: 16, fontWeight: "500", color: "#868e96" },
  emptyHint: {
    fontSize: 13,
    color: "#adb5bd",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  supplementCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  supplementInfo: { flex: 1 },
  supplementName: { fontSize: 16, fontWeight: "600", color: "#212529" },
  supplementMeta: { fontSize: 13, color: "#868e96", marginTop: 2 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: "#212529",
  },
  catalogCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  catalogInfo: { flex: 1 },
  catalogName: { fontSize: 15, fontWeight: "500", color: "#212529" },
  catalogCategory: { fontSize: 12, color: "#868e96", marginTop: 2 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7f5ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
    gap: 4,
  },
  aiBadgeText: { fontSize: 11, fontWeight: "600", color: "#228be6" },
});
