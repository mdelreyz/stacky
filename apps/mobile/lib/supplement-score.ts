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
  strong: 90,
  moderate: 75,
  emerging: 61,
  limited: 46,
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

const CATEGORY_ESSENTIAL_BONUS: Record<SupplementCategory, number> = {
  healthy_aging: 12,
  energy_mitochondria: 11,
  brain_mood_stress: 8,
  sleep_recovery: 7,
  cardiovascular: 9,
  glucose_metabolic: 8,
  gut_digestion: 8,
  detox_binding: 4,
  immune_antimicrobial: 9,
  inflammation_antioxidant: 10,
  hormones_fertility: 5,
  musculoskeletal: 8,
  other: 4,
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

const FOUNDATION_SIGNALS = new Set([
  "longevity",
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
  return value.trim().replace(/_/g, " ").toLowerCase();
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
  const dosageBonus = ai ? Math.min(5, ai.typical_dosages.length * 2) : 0;
  const sourcingBonus = ai?.sources_summary ? 4 : 0;
  const safetyCoverageBonus = ai && (ai.known_interactions.length > 0 || ai.safety_notes) ? 3 : 0;
  return roundScore(base + dosageBonus + sourcingBonus + safetyCoverageBonus);
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

function buildEssentialScore(supplement: Supplement, evidenceScore: number, safetyConfidence: number): number {
  const { goals, tags } = collectSignals(supplement);
  const foundationalMatches = [...goals, ...tags].filter((signal) => FOUNDATION_SIGNALS.has(signal)).length;
  const breadthScore = goals.length * 5 + Math.min(tags.length, 4) * 3;

  return roundScore(
    14
      + evidenceScore * 0.38
      + safetyConfidence * 0.16
      + foundationalMatches * 3.5
      + breadthScore
      + CATEGORY_ESSENTIAL_BONUS[supplement.category]
      + (supplement.source === "catalog" ? 4 : 0),
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
  return "Limited support relative to more established staples";
}

function buildEssentialNote(score: number): string {
  if (score >= 80) return "Broad, foundational value in a long-term stack";
  if (score >= 60) return "Useful, but more context-dependent than core staples";
  return "Niche support rather than a true foundation layer";
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
