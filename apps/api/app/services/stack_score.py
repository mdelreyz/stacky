"""Stack Score — rates the user's current regimen 0-100.

Dimensions:
  - Goal coverage (40%): how well the stack addresses the user's stated goals
  - Evidence quality (20%): average evidence quality of items with AI profiles
  - Interaction safety (20%): penalty for dangerous interactions
  - Synergy bonus (10%): reward for known beneficial pairings
  - Diversity (10%): coverage across body systems / categories

Each dimension returns a 0-1 float. The final score is a weighted sum × 100.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.models.user_preferences import UserPreferences
from app.services.interaction_checker import Interaction

logger = logging.getLogger(__name__)

# ── Known synergies (substance pairs that work better together) ──────────────

KNOWN_SYNERGIES: list[tuple[str, str, str]] = [
    ("Vitamin D3", "Vitamin K2 MK-7", "K2 directs calcium mobilized by D3 into bones, not arteries"),
    ("Curcumin", "Piperine", "Piperine increases curcumin bioavailability by up to 2000%"),
    ("Omega-3 Fish Oil", "Curcumin", "Both are anti-inflammatory via different pathways — additive benefit"),
    ("Vitamin C", "Iron Bisglycinate", "Vitamin C enhances non-heme iron absorption"),
    ("Magnesium Glycinate", "Vitamin D3", "Magnesium is required for vitamin D activation"),
    ("CoQ10 (Ubiquinol)", "Alpha-Lipoic Acid", "Both support mitochondrial electron transport chain"),
    ("NMN (Nicotinamide Mononucleotide)", "Resveratrol", "NMN provides NAD+ substrate, resveratrol activates sirtuins that consume it"),
    ("Zinc Picolinate", "Quercetin", "Quercetin acts as a zinc ionophore, improving cellular uptake"),
    ("L-Theanine", "Caffeine", "L-theanine smooths caffeine's stimulant effect, reducing jitter"),
    ("Ashwagandha (KSM-66)", "Rhodiola Rosea", "Dual adaptogen stack — ashwagandha for cortisol, rhodiola for fatigue"),
    ("Probiotics (Multi-Strain)", "Psyllium Husk", "Prebiotics feed probiotic bacteria, improving colonization"),
    ("Collagen Peptides", "Vitamin C", "Vitamin C is a cofactor for collagen synthesis"),
    ("Creatine Monohydrate", "Beta-Alanine", "Creatine for phosphocreatine, beta-alanine for carnosine — complementary energy buffers"),
    ("Lion's Mane Mushroom", "Alpha-GPC", "NGF stimulation (lion's mane) + acetylcholine precursor (alpha-GPC)"),
    ("Berberine", "Alpha-Lipoic Acid", "Both activate AMPK via different mechanisms — synergistic metabolic benefit"),
]

# ── Goal → relevant body-system categories mapping ──────────────────────────

GOAL_CATEGORY_MAP: dict[str, set[str]] = {
    "longevity": {"healthy_aging", "cardiovascular", "energy_mitochondria", "inflammation_antioxidant"},
    "cognitive": {"brain_mood_stress", "energy_mitochondria"},
    "sleep": {"sleep_recovery", "brain_mood_stress"},
    "stress": {"brain_mood_stress", "sleep_recovery"},
    "energy": {"energy_mitochondria", "healthy_aging"},
    "immunity": {"immune_antimicrobial", "inflammation_antioxidant"},
    "skin": {"inflammation_antioxidant", "healthy_aging"},
    "hair": {"hormones_fertility", "inflammation_antioxidant"},
    "joint_health": {"musculoskeletal", "inflammation_antioxidant"},
    "gut_health": {"gut_digestion", "immune_antimicrobial"},
    "weight_management": {"glucose_metabolic", "gut_digestion"},
    "muscle_recovery": {"musculoskeletal", "energy_mitochondria", "sleep_recovery"},
    "cardiovascular": {"cardiovascular", "inflammation_antioxidant"},
    "hormonal_balance": {"hormones_fertility", "healthy_aging"},
}

EVIDENCE_SCORES = {
    "strong": 1.0,
    "moderate": 0.75,
    "emerging": 0.55,
    "limited": 0.35,
    "traditional": 0.25,
    "speculative": 0.1,
}


@dataclass(slots=True)
class ScoreDimension:
    name: str
    score: float  # 0.0 to 1.0
    weight: float
    details: str


@dataclass(slots=True)
class SynergyPair:
    item_a: str
    item_b: str
    benefit: str


@dataclass(slots=True)
class StackScoreResult:
    total_score: int  # 0-100
    dimensions: list[ScoreDimension]
    synergies_found: list[SynergyPair]
    suggestions: list[str]
    item_count: int


def compute_stack_score(
    *,
    item_dicts: list[dict],
    interactions: list[Interaction],
    preferences: UserPreferences | None,
) -> StackScoreResult:
    """Compute a 0-100 stack score from the user's active items."""
    if not item_dicts:
        return StackScoreResult(
            total_score=0,
            dimensions=[],
            synergies_found=[],
            suggestions=["Add items to your regimen to get a stack score."],
            item_count=0,
        )

    goals = (preferences.primary_goals if preferences and preferences.primary_goals else None) or ["longevity"]
    item_names_lower = {item["name"].lower() for item in item_dicts}
    # Also include common names for synergy matching
    for item in item_dicts:
        for alias in item.get("common_names", []):
            item_names_lower.add(alias.lower())

    # ── Goal Coverage (40%) ──────────────────────────────────────────────
    goal_coverage = _compute_goal_coverage(item_dicts, goals)

    # ── Evidence Quality (20%) ───────────────────────────────────────────
    evidence_quality = _compute_evidence_quality(item_dicts)

    # ── Interaction Safety (20%) ─────────────────────────────────────────
    safety_score, safety_detail = _compute_safety(interactions)

    # ── Synergy Bonus (10%) ──────────────────────────────────────────────
    synergy_score, synergies_found = _compute_synergy(item_names_lower)

    # ── Diversity (10%) ──────────────────────────────────────────────────
    diversity_score = _compute_diversity(item_dicts)

    dimensions = [
        ScoreDimension("Goal Coverage", goal_coverage, 0.40, f"{int(goal_coverage * 100)}% of your goals are addressed"),
        ScoreDimension("Evidence Quality", evidence_quality, 0.20, f"Average evidence: {_evidence_label(evidence_quality)}"),
        ScoreDimension("Interaction Safety", safety_score, 0.20, safety_detail),
        ScoreDimension("Synergy Bonus", synergy_score, 0.10, f"{len(synergies_found)} beneficial pairing(s) detected"),
        ScoreDimension("Diversity", diversity_score, 0.10, f"Covers {_category_count(item_dicts)} body system(s)"),
    ]

    total = sum(d.score * d.weight for d in dimensions)
    total_score = min(100, max(0, round(total * 100)))

    suggestions = _generate_suggestions(
        total_score=total_score,
        goal_coverage=goal_coverage,
        safety_score=safety_score,
        synergies_found=synergies_found,
        interactions=interactions,
        item_count=len(item_dicts),
        goals=goals,
    )

    return StackScoreResult(
        total_score=total_score,
        dimensions=dimensions,
        synergies_found=synergies_found,
        suggestions=suggestions,
        item_count=len(item_dicts),
    )


def _compute_goal_coverage(item_dicts: list[dict], goals: list[str]) -> float:
    if not goals:
        return 0.5

    covered_goals = 0
    for goal in goals:
        relevant_categories = GOAL_CATEGORY_MAP.get(goal, set())

        has_category_match = any(
            item.get("category") in relevant_categories for item in item_dicts
        )
        has_goal_tag_match = any(
            goal in (item.get("goals") or []) for item in item_dicts
        )

        if has_category_match or has_goal_tag_match:
            covered_goals += 1

    return covered_goals / len(goals)


def _compute_evidence_quality(item_dicts: list[dict]) -> float:
    scores = []
    for item in item_dicts:
        profile = item.get("ai_profile")
        if profile and isinstance(profile, dict):
            quality = profile.get("evidence_quality", "")
            if quality in EVIDENCE_SCORES:
                scores.append(EVIDENCE_SCORES[quality])

    if not scores:
        return 0.5  # Neutral when no data

    return sum(scores) / len(scores)


def _compute_safety(interactions: list[Interaction]) -> tuple[float, str]:
    if not interactions:
        return 1.0, "No known interactions detected"

    penalty = 0.0
    for interaction in interactions:
        if interaction.severity == "critical":
            penalty += 0.5
        elif interaction.severity == "major":
            penalty += 0.3
        elif interaction.severity == "moderate":
            penalty += 0.15
        elif interaction.severity == "minor":
            penalty += 0.05

    score = max(0.0, 1.0 - penalty)
    count = len(interactions)
    worst = max(interactions, key=lambda i: {"critical": 4, "major": 3, "moderate": 2, "minor": 1}.get(i.severity, 0))
    return score, f"{count} interaction(s) found — worst severity: {worst.severity}"


def _compute_synergy(item_names_lower: set[str]) -> tuple[float, list[SynergyPair]]:
    found: list[SynergyPair] = []

    for name_a, name_b, benefit in KNOWN_SYNERGIES:
        a_present = name_a.lower() in item_names_lower
        b_present = name_b.lower() in item_names_lower

        if a_present and b_present:
            found.append(SynergyPair(item_a=name_a, item_b=name_b, benefit=benefit))

    # Each synergy pair adds 0.2 to the score, capped at 1.0
    score = min(1.0, len(found) * 0.2)
    return score, found


def _compute_diversity(item_dicts: list[dict]) -> float:
    categories = {item.get("category") for item in item_dicts if item.get("category")}
    categories.discard("other")
    # 12 total body-system categories; covering 4+ is solid diversity
    return min(1.0, len(categories) / 4.0)


def _category_count(item_dicts: list[dict]) -> int:
    categories = {item.get("category") for item in item_dicts if item.get("category")}
    categories.discard("other")
    return len(categories)


def _evidence_label(score: float) -> str:
    if score >= 0.9:
        return "strong"
    if score >= 0.65:
        return "moderate"
    if score >= 0.45:
        return "emerging"
    if score >= 0.3:
        return "limited"
    if score >= 0.18:
        return "traditional"
    return "speculative"


def _generate_suggestions(
    *,
    total_score: int,
    goal_coverage: float,
    safety_score: float,
    synergies_found: list[SynergyPair],
    interactions: list[Interaction],
    item_count: int,
    goals: list[str],
) -> list[str]:
    suggestions: list[str] = []

    if safety_score < 0.7:
        critical = [i for i in interactions if i.severity in ("critical", "major")]
        if critical:
            suggestions.append(
                f"Review {critical[0].item_a} + {critical[0].item_b} interaction — {critical[0].severity} severity. "
                "Consult a healthcare provider."
            )

    if goal_coverage < 0.5 and goals:
        uncovered = [
            g for g in goals
            if g in GOAL_CATEGORY_MAP
        ]
        if uncovered:
            suggestions.append(f"Your stack could better address: {', '.join(uncovered[:3])}. Try the AI recommendations.")

    if item_count < 3:
        suggestions.append("A broader stack (3-5 core items) typically scores higher. Use recommendations to fill gaps.")

    if not synergies_found and item_count >= 2:
        suggestions.append("No synergies detected yet. Pairing D3+K2 or curcumin+piperine can boost effectiveness.")

    if total_score >= 80 and not suggestions:
        suggestions.append("Strong stack — well-balanced across your goals with good evidence backing.")

    return suggestions
