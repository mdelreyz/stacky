import type { NutritionCycle, Protocol } from "@/lib/api";

const NUTRITION_TYPE_LABELS: Record<NutritionCycle["cycle_type"], string> = {
  macro_profile: "Macro Profile",
  named_diet: "Named Diet",
  elimination: "Elimination",
  custom: "Custom",
};

export function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export function matchesSearch(query: string, ...values: Array<string | null | undefined>) {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

export function humanizeLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function getProtocolItemNames(stack: Protocol) {
  return stack.items
    .map(
      (item) =>
        item.user_supplement?.supplement.name ??
        item.user_medication?.medication.name ??
        item.user_therapy?.therapy.name ??
        item.user_peptide?.peptide.name
    )
    .filter((name): name is string => Boolean(name));
}

export function formatNutritionTypeLabel(value: NutritionCycle["cycle_type"]) {
  return NUTRITION_TYPE_LABELS[value];
}
