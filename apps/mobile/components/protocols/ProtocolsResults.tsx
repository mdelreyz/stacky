import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, type Href } from "expo-router";

import { colors } from "@/constants/Colors";
import { getFrequencyLabel, getTakeWindowLabel } from "@/lib/schedule";
import { describeTherapySettings, formatLastCompletedAt, readTherapySettings } from "@/lib/therapy-settings";
import { formatNutritionTypeLabel, humanizeLabel } from "@/lib/protocols-search";
import { ActiveProtocolItemsSection } from "./ActiveProtocolItemsSection";
import { CatalogSection } from "./CatalogSection";
import { ProtocolStacksSection } from "./ProtocolStacksSection";
import type {
  Exercise,
  ExerciseRegime,
  Medication,
  NutritionCycle,
  Peptide,
  Protocol,
  ProtocolTemplateListItem,
  Supplement,
  Therapy,
  UserMedication,
  UserPeptide,
  UserSupplement,
  UserTherapy,
  WorkoutRoutineListItem,
} from "@/lib/api";

export function ProtocolsResults({
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
  medicationCatalog,
  outOfStockSupplements,
  peptideCatalog,
  stacks,
  supplementCatalog,
  therapyCatalog,
}: {
  exerciseCatalog: Exercise[];
  filteredMyMedications: UserMedication[];
  filteredMyPeptides: UserPeptide[];
  filteredMySupplements: UserSupplement[];
  filteredMyTherapies: UserTherapy[];
  filteredNutritionPlans: NutritionCycle[];
  filteredRegimes: ExerciseRegime[];
  filteredRoutines: WorkoutRoutineListItem[];
  filteredStacks: Protocol[];
  filteredTemplateLibrary: ProtocolTemplateListItem[];
  isSearching: boolean;
  medicationCatalog: Medication[];
  outOfStockSupplements: UserSupplement[];
  peptideCatalog: Peptide[];
  stacks: Protocol[];
  supplementCatalog: Supplement[];
  therapyCatalog: Therapy[];
}) {
  return (
    <>
      {!isSearching || filteredStacks.length > 0 ? (
        <ProtocolStacksSection
          stacks={filteredStacks}
          title={isSearching ? `Matching Stacks (${filteredStacks.length})` : `Stacks (${filteredStacks.length})`}
          actionHref={isSearching ? undefined : "/protocol/add"}
          actionLabel={isSearching ? undefined : "New Stack"}
        />
      ) : null}

      {!isSearching || filteredMySupplements.length > 0 ? (
        <ActiveProtocolItemsSection
          title="Active Supplements"
          actionHref="/supplement/add"
          actionLabel="Add"
          emptyIcon="flask"
          emptyTitle="No supplements added yet"
          emptyHint='Tap "Add" to onboard your first supplement with AI-powered insights.'
          items={filteredMySupplements.map((item) => ({
            id: item.id,
            name: item.supplement.name,
            meta: `${item.dosage_amount}${item.dosage_unit} · ${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
            detail: item.is_out_of_stock ? "Out of stock · included in refill note" : undefined,
            href: `/user-supplement/${item.id}` as Href,
          }))}
        />
      ) : null}

      {outOfStockSupplements.length > 0 ? (
        <Link href="/supplement/refill-request" asChild>
          <Pressable
            style={({ pressed }) => [styles.alertCard, pressed && styles.alertCardPressed]}
            accessibilityRole="button"
            accessibilityLabel="View supplements to reorder"
          >
            <View style={styles.alertHeader}>
              <FontAwesome name="shopping-bag" size={16} color={colors.warning} />
              <Text style={styles.alertTitle}>Supplements To Reorder</Text>
            </View>
            <Text style={styles.alertBody}>
              {outOfStockSupplements.length} active supplement
              {outOfStockSupplements.length === 1 ? "" : "s"} marked out of stock. Open the generated refill note for
              your next doctor or ordering request.
            </Text>
          </Pressable>
        </Link>
      ) : null}

      {!isSearching || filteredMyMedications.length > 0 ? (
        <ActiveProtocolItemsSection
          title="Active Medications"
          actionHref="/medication/add"
          actionLabel="Add"
          emptyIcon="medkit"
          emptyTitle="No medications added yet"
          emptyHint="Use the medication catalog for prescriptions, topicals, or hair-loss treatments you want tracked separately from supplements."
          items={filteredMyMedications.map((item) => ({
            id: item.id,
            name: item.medication.name,
            meta: `${item.dosage_amount}${item.dosage_unit} · ${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
            href: `/user-medication/${item.id}` as Href,
          }))}
        />
      ) : null}

      {!isSearching || filteredMyTherapies.length > 0 ? (
        <ActiveProtocolItemsSection
          title="Active Modalities"
          actionHref="/therapy/add"
          actionLabel="Add"
          emptyIcon="heartbeat"
          emptyTitle="No modalities added yet"
          emptyHint='Tap "Add" to browse and schedule therapies, recovery protocols, or device sessions.'
          items={filteredMyTherapies.map((item) => {
            const settings = readTherapySettings(item.settings);
            const lastCompletedAt = formatLastCompletedAt(settings.lastCompletedAt);

            return {
              id: item.id,
              name: item.therapy.name,
              meta: `${item.duration_minutes ? `${item.duration_minutes} min · ` : ""}${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
              detail: lastCompletedAt
                ? `${describeTherapySettings(item.settings) ?? "Session tracked"} · Last done ${lastCompletedAt}`
                : describeTherapySettings(item.settings),
              href: `/user-therapy/${item.id}` as Href,
            };
          })}
        />
      ) : null}

      {!isSearching || filteredMyPeptides.length > 0 ? (
        <ActiveProtocolItemsSection
          title="Active Peptides"
          actionHref="/peptide/add"
          actionLabel="Add"
          emptyIcon="eyedropper"
          emptyTitle="No peptides added yet"
          emptyHint='Tap "Add" to browse research peptides, therapeutic peptides, or performance compounds.'
          items={filteredMyPeptides.map((item) => ({
            id: item.id,
            name: item.peptide.name,
            meta: `${item.dosage_amount}${item.dosage_unit}${item.route ? ` · ${item.route}` : ""} · ${getFrequencyLabel(item.frequency)} · ${getTakeWindowLabel(item.take_window)}`,
            href: `/user-peptide/${item.id}` as Href,
          }))}
        />
      ) : null}

      {!isSearching || supplementCatalog.length > 0 ? (
        <CatalogSection
          title="Supplements"
          items={supplementCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            href: `/supplement/${item.id}` as Href,
            iconName: "flask",
            badgeLabel: item.source === "catalog" ? "Catalog" : "User-Created",
          }))}
          emptyText="No curated or user-created supplements matched your search."
        />
      ) : null}

      {!isSearching || medicationCatalog.length > 0 ? (
        <CatalogSection
          title="Medication Catalog"
          items={medicationCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            href: `/medication/${item.id}` as Href,
            iconName: "medkit",
          }))}
          emptyText="No medications matched your search."
        />
      ) : null}

      {!isSearching || therapyCatalog.length > 0 ? (
        <CatalogSection
          title="Modality Catalog"
          categoryFilter
          items={therapyCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            category: humanizeLabel(item.category),
            href: `/therapy/${item.id}` as Href,
            iconName: "heartbeat",
          }))}
          emptyText="No modalities matched your search."
        />
      ) : null}

      {!isSearching || peptideCatalog.length > 0 ? (
        <CatalogSection
          title="Peptide Catalog"
          categoryFilter
          items={peptideCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            category: humanizeLabel(item.category),
            href: `/peptide/${item.id}` as Href,
            iconName: "eyedropper",
          }))}
          emptyText="No peptides matched your search."
        />
      ) : null}

      {isSearching && exerciseCatalog.length > 0 ? (
        <CatalogSection
          title="Exercise Catalog"
          categoryFilter
          items={exerciseCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            category: `${humanizeLabel(item.primary_muscle)} · ${humanizeLabel(item.equipment)}`,
            href: `/exercise/${item.id}` as Href,
            iconName: "bolt",
            badgeLabel: item.user_id ? "User-Created" : "Catalog",
          }))}
          emptyText="No exercises matched your search."
        />
      ) : null}

      {isSearching && filteredNutritionPlans.length > 0 ? (
        <CatalogSection
          title="Nutrition Plans"
          items={filteredNutritionPlans.map((item) => ({
            id: item.id,
            name: item.name,
            category: `${formatNutritionTypeLabel(item.cycle_type)} · ${item.is_active ? "Active" : "Inactive"}`,
            href: `/nutrition/${item.id}` as Href,
            iconName: "leaf",
          }))}
          emptyText="No nutrition plans matched your search."
        />
      ) : null}

      {isSearching && filteredRoutines.length > 0 ? (
        <CatalogSection
          title="Workout Routines"
          items={filteredRoutines.map((item) => ({
            id: item.id,
            name: item.name,
            category: `${item.exercise_count} exercise${item.exercise_count === 1 ? "" : "s"}${item.estimated_duration_minutes ? ` · ${item.estimated_duration_minutes} min` : ""}`,
            href: `/workout-routine/${item.id}` as Href,
            iconName: "list-ol",
          }))}
          emptyText="No workout routines matched your search."
        />
      ) : null}

      {isSearching && filteredRegimes.length > 0 ? (
        <CatalogSection
          title="Exercise Regimes"
          items={filteredRegimes.map((item) => ({
            id: item.id,
            name: item.name,
            category: `${item.schedule_entries.length} scheduled day${item.schedule_entries.length === 1 ? "" : "s"} · ${item.is_active ? "Active" : "Inactive"}`,
            href: `/exercise-regime/${item.id}` as Href,
            iconName: "calendar",
          }))}
          emptyText="No exercise regimes matched your search."
        />
      ) : null}

      {isSearching && filteredTemplateLibrary.length > 0 ? (
        <CatalogSection
          title="Protocol Library"
          categoryFilter
          items={filteredTemplateLibrary.map((item) => ({
            id: item.id,
            name: item.name,
            category: humanizeLabel(item.category),
            href: `/protocol-template/${item.id}` as Href,
            iconName: "book",
            badgeLabel: item.is_featured ? "Catalog" : undefined,
          }))}
          emptyText="No protocol templates matched your search."
        />
      ) : null}

      <View style={styles.bottomSpacer} />
    </>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: "rgba(248,243,232,0.9)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    shadowColor: colors.warningDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  alertCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.warning,
  },
  alertBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
