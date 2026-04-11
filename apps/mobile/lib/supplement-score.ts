import type { Supplement, SupplementCategory } from "@protocols/domain";

export type SupplementScoreMetricKey =
  | "essential"
  | "scientifically_supported"
  | "used_by_experts"
  | "longevity";

export interface SupplementScoreMetric {
  key: SupplementScoreMetricKey;
  label: string;
  score: number;
  note: string;
}

export interface SupplementStrengthScore {
  label: string;
  score: number;
  source: "goal" | "mechanism" | "category";
}

export interface SupplementScoreSummary {
  metrics: SupplementScoreMetric[];
  strengths: SupplementStrengthScore[];
}

const EVIDENCE_BASE_SCORE = {
  strong: 92,
  moderate: 72,
  emerging: 54,
  limited: 34,
  traditional: 24,
  speculative: 12,
} as const;

const CATEGORY_LABELS: Record<SupplementCategory, string> = {
  healthy_aging: "Healthy Aging",
  energy_mitochondria: "Energy",
  brain_mood_stress: "Cognitive Performance",
  sleep_recovery: "Sleep",
  cardiovascular: "Cardiovascular Support",
  glucose_metabolic: "Metabolic Health",
  gut_digestion: "Gut Health",
  detox_binding: "Detox Support",
  immune_antimicrobial: "Immunity",
  inflammation_antioxidant: "Inflammation Control",
  hormones_fertility: "Hormonal Balance",
  musculoskeletal: "Joint Health",
  other: "General Support",
};

const CATEGORY_ESSENTIAL_WEIGHT: Record<SupplementCategory, number> = {
  healthy_aging: -6,
  energy_mitochondria: 2,
  brain_mood_stress: -10,
  sleep_recovery: -2,
  cardiovascular: 6,
  glucose_metabolic: 5,
  gut_digestion: 3,
  detox_binding: -12,
  immune_antimicrobial: 6,
  inflammation_antioxidant: 4,
  hormones_fertility: -12,
  musculoskeletal: 0,
  other: -8,
};

const CATEGORY_LONGEVITY_BONUS: Record<SupplementCategory, number> = {
  healthy_aging: 22,
  energy_mitochondria: 12,
  brain_mood_stress: 6,
  sleep_recovery: 4,
  cardiovascular: 10,
  glucose_metabolic: 10,
  gut_digestion: 6,
  detox_binding: 3,
  immune_antimicrobial: 5,
  inflammation_antioxidant: 14,
  hormones_fertility: 2,
  musculoskeletal: 4,
  other: 2,
};

const LONGEVITY_SIGNAL_WEIGHTS = new Map<string, number>([
  ["longevity", 24],
  ["healthy aging", 18],
  ["nad+ pathway", 12],
  ["mitochondrial support", 11],
  ["antioxidant", 9],
  ["anti-inflammatory", 8],
  ["ampk activator", 11],
  ["senolytic", 12],
  ["epigenetic modulator", 10],
  ["hormesis", 10],
  ["mtor modulation", 8],
  ["glucose control", 6],
  ["metabolic health", 7],
  ["cardiovascular", 6],
]);

const EXPERT_SIGNAL_WEIGHTS = new Map<string, number>([
  ["nad+ pathway", 10],
  ["mitochondrial support", 8],
  ["senolytic", 10],
  ["epigenetic modulator", 9],
  ["ampk activator", 8],
  ["mtor modulation", 8],
  ["hormesis", 8],
  ["neuroprotective", 6],
  ["gut microbiome modulation", 6],
  ["adaptogen", 5],
  ["anti-inflammatory", 5],
  ["antioxidant", 4],
]);

const SIGNAL_ALIASES = new Map<string, string>([
  ["antioxidant support", "antioxidant"],
  ["inflammation", "anti-inflammatory"],
  ["inflammation support", "anti-inflammatory"],
  ["anti inflammatory support", "anti-inflammatory"],
  ["immune support", "immunity"],
  ["immune modulation", "immunity"],
  ["cardiovascular support", "cardiovascular"],
  ["vascular support", "cardiovascular"],
  ["circulation", "cardiovascular"],
  ["cardiometabolic support", "metabolic health"],
  ["glucose regulation", "metabolic health"],
  ["glucose control", "metabolic health"],
  ["metabolic support", "metabolic health"],
  ["gut support", "gut health"],
  ["microbiome support", "gut health"],
  ["gut microbiome modulation", "gut health"],
  ["gut barrier support", "gut health"],
  ["fiber support", "gut health"],
  ["regularity support", "gut health"],
  ["sleep support", "sleep"],
  ["sleep onset support", "sleep"],
  ["energy metabolism", "energy"],
  ["mitochondrial biogenesis", "mitochondrial support"],
]);

const ESSENTIAL_FOUNDATION_SIGNALS = new Set([
  "energy",
  "immunity",
  "gut health",
  "cardiovascular",
  "metabolic health",
  "sleep",
  "anti-inflammatory",
  "antioxidant",
  "mitochondrial support",
]);

const ESSENTIAL_NUTRIENT_SIGNALS = new Set([
  "precision vitamin",
  "precision mineral",
  "trace mineral",
  "magnesium repletion",
  "omega 3 support",
  "multinutrient coverage",
  "protein repletion support",
]);

const ESSENTIAL_NICHE_SIGNALS = new Set([
  "medication like",
  "brand formula",
  "format family entry",
  "mixed protocol entry",
  "experimental compound",
  "condition targeted support",
  "targeted antimicrobial botanical",
  "targeted hormone botanical",
  "cns active nootropic",
  "data quality issue",
  "grouped alias entry",
  "food based support",
  "whole food",
  "detox / binder",
  "formula support",
]);

const SOURCE_PRIORITY: Record<SupplementStrengthScore["source"], number> = {
  mechanism: 3,
  goal: 2,
  category: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function normalizeSignal(value: string): string {
  const normalized = value.trim().replace(/_/g, " ").toLowerCase();
  return SIGNAL_ALIASES.get(normalized) ?? normalized;
}

function startCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      if (part === part.toUpperCase()) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function buildEvidenceScore(supplement: Supplement): number {
  const ai = supplement.ai_profile;
  const base = ai ? EVIDENCE_BASE_SCORE[ai.evidence_quality] : 58;
  const dosageBonus = ai ? Math.min(4, ai.typical_dosages.length) : 0;
  const sourcingBonus = ai?.sources_summary ? 2 : 0;
  return roundScore(base + dosageBonus + sourcingBonus);
}

function buildSafetyConfidence(supplement: Supplement): number {
  const ai = supplement.ai_profile;
  if (!ai) {
    return 68;
  }

  const interactionPenalty = ai.known_interactions.reduce((total, interaction) => {
    if (interaction.severity === "critical") return total + 16;
    if (interaction.severity === "major") return total + 10;
    if (interaction.severity === "moderate") return total + 6;
    return total + 3;
  }, 0);
  const contraindicationPenalty = ai.contraindications.length * 5;
  const sideEffectPenalty = ai.side_effects.length * 2;
  const raw = 96 - interactionPenalty - contraindicationPenalty - sideEffectPenalty;
  return roundScore(clamp(raw, 42, 96));
}

function collectSignals(supplement: Supplement): { goals: string[]; tags: string[] } {
  const goals = Array.from(new Set((supplement.goals ?? []).map(normalizeSignal)));
  const tags = Array.from(new Set((supplement.mechanism_tags ?? []).map(normalizeSignal)));
  return { goals, tags };
}

function buildEssentialBaseline(coreSignalCount: number, nutrientSignalCount: number): number {
  if (coreSignalCount >= 2 && nutrientSignalCount >= 1) return 76;
  if (coreSignalCount >= 1 && nutrientSignalCount >= 1) return 64;
  if (coreSignalCount >= 4) return 62;
  if (coreSignalCount >= 3) return 52;
  if (nutrientSignalCount >= 1) return 42;
  if (coreSignalCount >= 2) return 28;
  return 8;
}

function buildEssentialScore(supplement: Supplement, evidenceScore: number, safetyConfidence: number): number {
  const { goals, tags } = collectSignals(supplement);
  const signals = Array.from(new Set([...goals, ...tags]));
  const coreSignalCount = signals.filter((signal) => ESSENTIAL_FOUNDATION_SIGNALS.has(signal)).length;
  const nutrientSignalCount = signals.filter((signal) => ESSENTIAL_NUTRIENT_SIGNALS.has(signal)).length;
  const nicheSignalCount = signals.filter((signal) => ESSENTIAL_NICHE_SIGNALS.has(signal)).length;
  const universalSignalCount = coreSignalCount + nutrientSignalCount;
  const synergyBonus = universalSignalCount >= 3 ? 9 : 0;
  const nutrientQualityBonus =
    nutrientSignalCount >= 1 && evidenceScore >= 75 && safetyConfidence >= 75
      ? coreSignalCount >= 2
        ? 14
        : coreSignalCount >= 1
          ? 9
          : 4
      : 0;
  const broadCoverageBonus = coreSignalCount >= 4 && evidenceScore >= 75 && safetyConfidence >= 70 ? 4 : 0;
  const highEvidenceRepletionBonus = nutrientSignalCount >= 1 && evidenceScore >= 90 ? 5 : 0;

  // Essential is intentionally sparse: broad nutrient repletion and universally useful
  // support should score high, while niche or protocol-specific entries should fall away.
  return roundScore(
    buildEssentialBaseline(coreSignalCount, nutrientSignalCount)
      + Math.max(0, evidenceScore - 40) * 0.28
      + Math.max(0, safetyConfidence - 55) * 0.18
      + CATEGORY_ESSENTIAL_WEIGHT[supplement.category]
      + synergyBonus
      + nutrientQualityBonus
      + broadCoverageBonus
      + highEvidenceRepletionBonus
      - nicheSignalCount * 16,
  );
}

function buildUsedByExpertsScore(supplement: Supplement, evidenceScore: number): { score: number; signalCount: number } {
  const ai = supplement.ai_profile;
  const { goals, tags } = collectSignals(supplement);
  const expertSignalCount = [...goals, ...tags].reduce((total, signal) => total + (EXPERT_SIGNAL_WEIGHTS.get(signal) ?? 0), 0);
  const protocolReadiness =
    (ai ? Math.min(8, ai.forms.length * 2 + ai.typical_dosages.length * 2) : 0)
    + (ai ? Math.min(6, ai.synergies.length * 2) : 0);

  return {
    score: roundScore(
      28
        + evidenceScore * 0.34
        + expertSignalCount
        + protocolReadiness
        + (supplement.source === "catalog" ? 6 : 0),
    ),
    signalCount: expertSignalCount,
  };
}

function buildLongevityScore(supplement: Supplement, evidenceScore: number): { score: number; signalCount: number } {
  const { goals, tags } = collectSignals(supplement);
  const signalCount = [...goals, ...tags].reduce((total, signal) => total + (LONGEVITY_SIGNAL_WEIGHTS.get(signal) ?? 0), 0);

  return {
    score: roundScore(
      18
        + evidenceScore * 0.34
        + signalCount
        + CATEGORY_LONGEVITY_BONUS[supplement.category],
    ),
    signalCount,
  };
}

function buildScientificSupportNote(supplement: Supplement): string {
  const evidence = supplement.ai_profile?.evidence_quality ?? "moderate";
  if (evidence === "strong") return "Strong evidence plus mature dosing guidance";
  if (evidence === "moderate") return "Solid support with practical dosing guidance";
  if (evidence === "emerging") return "Promising data, but still developing";
  if (evidence === "traditional") return "Longstanding use, but thinner modern evidence";
  if (evidence === "speculative") return "Interesting rationale, but still highly provisional";
  return "Limited support relative to more established staples";
}

function buildEssentialNote(score: number): string {
  if (score >= 90) return "Rare true default pick with broad utility for almost everyone";
  if (score >= 50) return "Broadly useful, but not close to a universal staple";
  return "Context-specific rather than an everybody-should-take-it supplement";
}

function buildExpertNote(signalCount: number): string {
  if (signalCount >= 18) return "Frequently appears in advanced protocol conversations";
  if (signalCount >= 8) return "Shows up in expert-built stacks with some regularity";
  return "More situational than expert-default";
}

function buildLongevityNote(signalCount: number): string {
  if (signalCount >= 24) return "Strong alignment with longevity-oriented protocols";
  if (signalCount >= 10) return "Meaningful longevity relevance, but not the main story";
  return "Secondary longevity fit versus other use cases";
}

function pushStrength(
  strengths: Map<string, SupplementStrengthScore>,
  label: string,
  score: number,
  source: SupplementStrengthScore["source"],
) {
  const key = label.toLowerCase();
  const next = { label, score: roundScore(score), source };
  const existing = strengths.get(key);
  if (!existing) {
    strengths.set(key, next);
    return;
  }

  if (next.score > existing.score || (next.score === existing.score && SOURCE_PRIORITY[source] > SOURCE_PRIORITY[existing.source])) {
    strengths.set(key, next);
  }
}

function buildStrengths(supplement: Supplement, evidenceScore: number, longevityScore: number): SupplementStrengthScore[] {
  const { goals, tags } = collectSignals(supplement);
  const strengths = new Map<string, SupplementStrengthScore>();

  goals.forEach((goal) => {
    const goalBonus = goal === "longevity" ? 8 : goal === "energy" ? 5 : 4;
    pushStrength(strengths, startCase(goal), 48 + evidenceScore * 0.28 + goalBonus, "goal");
  });

  tags.forEach((tag) => {
    const longevityBonus = LONGEVITY_SIGNAL_WEIGHTS.get(tag) ?? 0;
    const expertBonus = EXPERT_SIGNAL_WEIGHTS.get(tag) ?? 0;
    pushStrength(strengths, startCase(tag), 52 + evidenceScore * 0.24 + longevityBonus * 0.55 + expertBonus * 0.45, "mechanism");
  });

  pushStrength(
    strengths,
    CATEGORY_LABELS[supplement.category],
    44 + evidenceScore * 0.22 + CATEGORY_LONGEVITY_BONUS[supplement.category] * 0.35,
    "category",
  );

  if (longevityScore >= 70) {
    pushStrength(strengths, "Longevity", longevityScore, "goal");
  }

  return [...strengths.values()]
    .sort((a, b) => b.score - a.score || SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source])
    .slice(0, 6);
}

export function buildSupplementScoreSummary(supplement: Supplement): SupplementScoreSummary {
  const evidenceScore = buildEvidenceScore(supplement);
  const safetyConfidence = buildSafetyConfidence(supplement);
  const essential = buildEssentialScore(supplement, evidenceScore, safetyConfidence);
  const usedByExperts = buildUsedByExpertsScore(supplement, evidenceScore);
  const longevity = buildLongevityScore(supplement, evidenceScore);

  return {
    metrics: [
      {
        key: "essential",
        label: "Essential",
        score: essential,
        note: buildEssentialNote(essential),
      },
      {
        key: "scientifically_supported",
        label: "Scientifically Supported",
        score: evidenceScore,
        note: buildScientificSupportNote(supplement),
      },
      {
        key: "used_by_experts",
        label: "Used by Experts",
        score: usedByExperts.score,
        note: buildExpertNote(usedByExperts.signalCount),
      },
      {
        key: "longevity",
        label: "Longevity",
        score: longevity.score,
        note: buildLongevityNote(longevity.signalCount),
      },
    ],
    strengths: buildStrengths(supplement, evidenceScore, longevity.score),
  };
}
