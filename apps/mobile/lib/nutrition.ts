import type { MacroLevel, NutritionCycleType, NutritionPhase } from "@/lib/api";

export const NUTRITION_CYCLE_TYPE_OPTIONS: ReadonlyArray<{
  value: NutritionCycleType;
  label: string;
}> = [
  { value: "macro_profile", label: "Macro Profile" },
  { value: "named_diet", label: "Named Diet" },
  { value: "elimination", label: "Elimination" },
  { value: "custom", label: "Custom" },
];

export const MACRO_LEVEL_OPTIONS: ReadonlyArray<{ value: MacroLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function getNutritionCycleTypeLabel(value: NutritionCycleType): string {
  return NUTRITION_CYCLE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatMacroProfile(
  macroProfile: NutritionPhase["macro_profile"] | null | undefined
): string | null {
  if (!macroProfile) {
    return null;
  }

  return `Carbs ${capitalize(macroProfile.carbs)} · Protein ${capitalize(
    macroProfile.protein
  )} · Fat ${capitalize(macroProfile.fat)}`;
}

export function formatNutritionPhaseSummary(phase: NutritionPhase): string[] {
  const summary: string[] = [];
  const macros = formatMacroProfile(phase.macro_profile);
  if (macros) {
    summary.push(macros);
  }
  if (phase.pattern?.trim()) {
    summary.push(phase.pattern.trim());
  }
  if (phase.restrictions.length > 0) {
    summary.push(phase.restrictions.join(", "));
  }
  return summary;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
