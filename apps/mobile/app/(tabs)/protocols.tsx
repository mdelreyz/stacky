import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { CatalogSearchInput } from "@/components/protocols/CatalogSearchInput";
import { ProtocolsActionLinks } from "@/components/protocols/ProtocolsActionLinks";
import { ProtocolsHeroCard } from "@/components/protocols/ProtocolsHeroCard";
import { ProtocolsResults } from "@/components/protocols/ProtocolsResults";
import { ProtocolsSearchStateCard } from "@/components/protocols/ProtocolsSearchStateCard";
import { StackScoreCard } from "@/components/protocols/StackScoreCard";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { useProtocolsScreenData } from "@/lib/useProtocolsScreenData";

export default function ProtocolsScreen() {
  const {
    activeProtocolCount,
    deferredSearch,
    exerciseCatalog,
    filteredMyMedications,
    filteredMyPeptides,
    filteredMySupplements,
    filteredMyTherapies,
    filteredNutritionPlans,
    filteredRegimes,
    filteredRoutines,
    filteredStacks,
    filteredTemplateLibrary,
    isSearching,
    loading,
    medicationCatalog,
    outOfStockSupplements,
    peptideCatalog,
    refresh,
    refreshing,
    search,
    searchMatchCount,
    setSearch,
    stacks,
    supplementCatalog,
    therapyCatalog,
    visibleCatalogCount,
  } = useProtocolsScreenData();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />

      <FadeInView>
        <ProtocolsHeroCard
          activeProtocolCount={activeProtocolCount}
          stackCount={stacks.length}
          visibleCatalogCount={visibleCatalogCount}
        />
        <StackScoreCard />
        <ProtocolsActionLinks />
        <CatalogSearchInput value={search} onChangeText={setSearch} />
        <ProtocolsSearchStateCard
          deferredSearch={deferredSearch}
          isSearching={isSearching}
          searchMatchCount={searchMatchCount}
        />
        <ProtocolsResults
          exerciseCatalog={exerciseCatalog}
          filteredMyMedications={filteredMyMedications}
          filteredMyPeptides={filteredMyPeptides}
          filteredMySupplements={filteredMySupplements}
          filteredMyTherapies={filteredMyTherapies}
          filteredNutritionPlans={filteredNutritionPlans}
          filteredRegimes={filteredRegimes}
          filteredRoutines={filteredRoutines}
          filteredStacks={filteredStacks}
          filteredTemplateLibrary={filteredTemplateLibrary}
          isSearching={isSearching}
          medicationCatalog={medicationCatalog}
          outOfStockSupplements={outOfStockSupplements}
          peptideCatalog={peptideCatalog}
          stacks={stacks}
          supplementCatalog={supplementCatalog}
          therapyCatalog={therapyCatalog}
        />
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 40, position: "relative" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { height: 620 },
});
