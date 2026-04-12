import { useCallback, useDeferredValue, useState } from "react";
import { useFocusEffect } from "expo-router";

import {
  exerciseRegimes as exerciseRegimesApi,
  exercises as exercisesApi,
  medications as medicationsApi,
  nutrition as nutritionApi,
  peptides as peptidesApi,
  protocols as protocolsApi,
  protocolTemplates as protocolTemplatesApi,
  supplements as supplementsApi,
  therapies as therapiesApi,
  userMedications as userMedicationsApi,
  userPeptides as userPeptidesApi,
  userSupplements as userSupplementsApi,
  userTherapies as userTherapiesApi,
  workoutRoutines as workoutRoutinesApi,
} from "@/lib/api";
import { cached } from "@/lib/cache";
import { showError } from "@/lib/errors";
import { describeTherapySettings } from "@/lib/therapy-settings";
import {
  formatNutritionTypeLabel,
  getProtocolItemNames,
  humanizeLabel,
  matchesSearch,
  normalizeSearchValue,
} from "@/lib/protocols-search";
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

export function useProtocolsScreenData() {
  const [stacks, setStacks] = useState<Protocol[]>([]);
  const [supplementCatalog, setSupplementCatalog] = useState<Supplement[]>([]);
  const [medicationCatalog, setMedicationCatalog] = useState<Medication[]>([]);
  const [therapyCatalog, setTherapyCatalog] = useState<Therapy[]>([]);
  const [peptideCatalog, setPeptideCatalog] = useState<Peptide[]>([]);
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionCycle[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutineListItem[]>([]);
  const [regimes, setRegimes] = useState<ExerciseRegime[]>([]);
  const [templateLibrary, setTemplateLibrary] = useState<ProtocolTemplateListItem[]>([]);
  const [mySupplements, setMySupplements] = useState<UserSupplement[]>([]);
  const [myMedications, setMyMedications] = useState<UserMedication[]>([]);
  const [myTherapies, setMyTherapies] = useState<UserTherapy[]>([]);
  const [myPeptides, setMyPeptides] = useState<UserPeptide[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const deferredSearch = useDeferredValue(search.trim());
  const normalizedSearch = normalizeSearchValue(deferredSearch);
  const isSearching = normalizedSearch.length > 0;

  const fetchData = useCallback(async () => {
    try {
      const nextSearch = deferredSearch || undefined;
      const [
        stacksRes,
        supplementCatalogRes,
        medicationCatalogRes,
        therapyCatalogRes,
        peptideCatalogRes,
        exerciseCatalogRes,
        nutritionPlansRes,
        routinesRes,
        regimesRes,
        templateLibraryRes,
        mySupplementsRes,
        myMedicationsRes,
        myTherapiesRes,
        myPeptidesRes,
      ] = await Promise.allSettled([
        cached("protocols:stacks", () => protocolsApi.list()),
        cached(`catalog:supplements:${deferredSearch}`, () => supplementsApi.list({ search: nextSearch })),
        cached(`catalog:medications:${deferredSearch}`, () => medicationsApi.list({ search: nextSearch })),
        cached(`catalog:therapies:${deferredSearch}`, () => therapiesApi.list({ search: nextSearch })),
        cached(`catalog:peptides:${deferredSearch}`, () => peptidesApi.list({ search: nextSearch })),
        isSearching
          ? cached(`catalog:exercises:${deferredSearch}`, () => exercisesApi.list({ search: nextSearch }))
          : Promise.resolve({ items: [] as Exercise[] }),
        isSearching
          ? cached("nutrition:plans", () => nutritionApi.list({ active_only: false }))
          : Promise.resolve({ items: [] as NutritionCycle[] }),
        isSearching
          ? cached("workout:routines", () => workoutRoutinesApi.list())
          : Promise.resolve({ items: [] as WorkoutRoutineListItem[] }),
        isSearching
          ? cached("exercise:regimes", () => exerciseRegimesApi.list())
          : Promise.resolve({ items: [] as ExerciseRegime[] }),
        isSearching
          ? cached("protocol-templates:library", () => protocolTemplatesApi.list())
          : Promise.resolve([] as ProtocolTemplateListItem[]),
        cached("user:supplements", () => userSupplementsApi.list()),
        cached("user:medications", () => userMedicationsApi.list()),
        cached("user:therapies", () => userTherapiesApi.list()),
        cached("user:peptides", () => userPeptidesApi.list()),
      ]);

      setStacks(stacksRes.status === "fulfilled" ? stacksRes.value.items : []);
      setSupplementCatalog(supplementCatalogRes.status === "fulfilled" ? supplementCatalogRes.value.items : []);
      setMedicationCatalog(medicationCatalogRes.status === "fulfilled" ? medicationCatalogRes.value.items : []);
      setTherapyCatalog(therapyCatalogRes.status === "fulfilled" ? therapyCatalogRes.value.items : []);
      setPeptideCatalog(peptideCatalogRes.status === "fulfilled" ? peptideCatalogRes.value.items : []);
      setExerciseCatalog(exerciseCatalogRes.status === "fulfilled" ? exerciseCatalogRes.value.items : []);
      setNutritionPlans(nutritionPlansRes.status === "fulfilled" ? nutritionPlansRes.value.items : []);
      setRoutines(routinesRes.status === "fulfilled" ? routinesRes.value.items : []);
      setRegimes(regimesRes.status === "fulfilled" ? regimesRes.value.items : []);
      setTemplateLibrary(templateLibraryRes.status === "fulfilled" ? templateLibraryRes.value : []);
      setMySupplements(mySupplementsRes.status === "fulfilled" ? mySupplementsRes.value.items : []);
      setMyMedications(myMedicationsRes.status === "fulfilled" ? myMedicationsRes.value.items : []);
      setMyTherapies(myTherapiesRes.status === "fulfilled" ? myTherapiesRes.value.items : []);
      setMyPeptides(myPeptidesRes.status === "fulfilled" ? myPeptidesRes.value.items : []);

      const allRejected = [
        stacksRes,
        supplementCatalogRes,
        medicationCatalogRes,
        therapyCatalogRes,
        peptideCatalogRes,
        exerciseCatalogRes,
        nutritionPlansRes,
        routinesRes,
        regimesRes,
        templateLibraryRes,
        mySupplementsRes,
        myMedicationsRes,
        myTherapiesRes,
        myPeptidesRes,
      ].every((result) => result.status === "rejected");

      if (allRejected) {
        showError("Failed to load protocols");
      }
    } catch {
      showError("Failed to load protocols");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deferredSearch, isSearching]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void fetchData();
  }, [fetchData]);

  const filteredStacks = isSearching
    ? stacks.filter((stack) =>
        matchesSearch(normalizedSearch, stack.name, stack.description, stack.schedule_summary, ...getProtocolItemNames(stack)),
      )
    : stacks;
  const filteredMySupplements = isSearching
    ? mySupplements.filter((item) =>
        matchesSearch(normalizedSearch, item.supplement.name, item.supplement.category, item.notes),
      )
    : mySupplements;
  const filteredMyMedications = isSearching
    ? myMedications.filter((item) =>
        matchesSearch(normalizedSearch, item.medication.name, item.medication.category, item.notes),
      )
    : myMedications;
  const filteredMyTherapies = isSearching
    ? myTherapies.filter((item) =>
        matchesSearch(
          normalizedSearch,
          item.therapy.name,
          item.therapy.category,
          item.notes,
          describeTherapySettings(item.settings),
        ),
      )
    : myTherapies;
  const filteredMyPeptides = isSearching
    ? myPeptides.filter((item) =>
        matchesSearch(normalizedSearch, item.peptide.name, item.peptide.category, item.route, item.notes, item.storage_notes),
      )
    : myPeptides;
  const filteredNutritionPlans = isSearching
    ? nutritionPlans.filter((plan) =>
        matchesSearch(
          normalizedSearch,
          plan.name,
          formatNutritionTypeLabel(plan.cycle_type),
          ...plan.phases.flatMap((phase) => [phase.name, phase.pattern, phase.notes, phase.restrictions.join(" ")]),
        ),
      )
    : [];
  const filteredRoutines = isSearching
    ? routines.filter((routine) => matchesSearch(normalizedSearch, routine.name, routine.description))
    : [];
  const filteredRegimes = isSearching
    ? regimes.filter((regime) =>
        matchesSearch(
          normalizedSearch,
          regime.name,
          regime.description,
          ...regime.schedule_entries.map((entry) => `${entry.day_of_week} ${entry.routine.name}`),
        ),
      )
    : [];
  const filteredTemplateLibrary = isSearching
    ? templateLibrary.filter((template) =>
        matchesSearch(
          normalizedSearch,
          template.name,
          template.description,
          humanizeLabel(template.category),
          template.difficulty,
          template.tags?.join(" "),
        ),
      )
    : [];
  const searchMatchCount = isSearching
    ? filteredStacks.length +
      filteredMySupplements.length +
      filteredMyMedications.length +
      filteredMyTherapies.length +
      filteredMyPeptides.length +
      supplementCatalog.length +
      medicationCatalog.length +
      therapyCatalog.length +
      peptideCatalog.length +
      exerciseCatalog.length +
      filteredNutritionPlans.length +
      filteredRoutines.length +
      filteredRegimes.length +
      filteredTemplateLibrary.length
    : 0;
  const outOfStockSupplements = filteredMySupplements.filter((item) => item.is_out_of_stock);
  const activeProtocolCount = mySupplements.length + myMedications.length + myTherapies.length + myPeptides.length;
  const visibleCatalogCount =
    supplementCatalog.length + medicationCatalog.length + therapyCatalog.length + peptideCatalog.length;

  return {
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
    templateLibrary,
    visibleCatalogCount,
  };
}
