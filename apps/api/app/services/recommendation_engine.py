"""AI-powered recommendation engine.

Takes user constraints (slot budget, goals, concerns) + catalog data
and produces ranked, personalized recommendations via Claude.
Falls back to a static priority heuristic when the API is unavailable.
"""

import json
import logging
from dataclasses import dataclass

from anthropic import Anthropic
from pydantic import BaseModel, ConfigDict

from app.config import settings
from app.models.supplement import Supplement, SupplementCategory
from app.models.medication import Medication, MedicationCategory
from app.models.therapy import Therapy
from app.models.peptide import Peptide
from app.models.user_preferences import UserPreferences
from app.services.stack_score import KNOWN_SYNERGIES

logger = logging.getLogger(__name__)

# ── Static priority tiers (fallback when Claude is unavailable) ──────────────

# Top-tier supplements for general longevity — evidence-based essentials
_LONGEVITY_ESSENTIALS = [
    "Omega-3 Fish Oil",
    "Vitamin D3",
    "Magnesium Glycinate",
    "Creatine Monohydrate",
    "Vitamin K2 MK-7",
    "CoQ10 (Ubiquinol)",
    "NMN (Nicotinamide Mononucleotide)",
    "Curcumin",
    "Resveratrol",
    "Berberine",
]

_GOAL_PRIORITIES: dict[str, list[str]] = {
    "cognitive": [
        "Lion's Mane Mushroom", "Omega-3 Fish Oil", "Creatine Monohydrate",
        "Alpha-GPC", "Bacopa Monnieri", "Phosphatidylserine",
        "L-Theanine", "Magnesium L-Threonate", "CDP-Choline", "Rhodiola Rosea",
    ],
    "sleep": [
        "Magnesium Glycinate", "L-Theanine", "Apigenin",
        "Glycine", "Tart Cherry Extract", "Ashwagandha (KSM-66)",
        "Reishi Mushroom", "GABA", "Valerian Root", "Melatonin",
    ],
    "energy": [
        "Creatine Monohydrate", "CoQ10 (Ubiquinol)", "NMN (Nicotinamide Mononucleotide)",
        "Iron Bisglycinate", "B-Complex", "Rhodiola Rosea",
        "Cordyceps Militaris", "PQQ", "Acetyl-L-Carnitine", "Alpha-Lipoic Acid",
    ],
    "stress": [
        "Ashwagandha (KSM-66)", "L-Theanine", "Rhodiola Rosea",
        "Magnesium Glycinate", "Holy Basil (Tulsi)", "Phosphatidylserine",
        "Reishi Mushroom", "GABA", "Lemon Balm", "B-Complex",
    ],
    "immunity": [
        "Vitamin D3", "Vitamin C", "Zinc Picolinate",
        "Elderberry Extract", "Beta-Glucans", "Quercetin",
        "Reishi Mushroom", "Astragalus", "Echinacea", "Selenium",
    ],
    "skin": [
        "Collagen Peptides", "Vitamin C", "Hyaluronic Acid",
        "Astaxanthin", "Vitamin E (Mixed Tocopherols)", "Zinc Picolinate",
        "Omega-3 Fish Oil", "Biotin", "Selenium", "Resveratrol",
    ],
    "hair": [
        "Biotin", "Collagen Peptides", "Zinc Picolinate",
        "Iron Bisglycinate", "Saw Palmetto", "Vitamin D3",
        "Omega-3 Fish Oil", "Selenium", "Silica", "B-Complex",
    ],
    "joint_health": [
        "Collagen Peptides", "Omega-3 Fish Oil", "Glucosamine + Chondroitin",
        "Curcumin", "Boswellia Serrata", "MSM",
        "Hyaluronic Acid", "Vitamin C", "Vitamin D3", "Magnesium Glycinate",
    ],
    "gut_health": [
        "Probiotics (Multi-Strain)", "L-Glutamine", "Psyllium Husk",
        "Digestive Enzymes", "Slippery Elm", "Berberine",
        "Saccharomyces Boulardii", "Zinc Carnosine", "Butyrate", "Aloe Vera",
    ],
    "weight_management": [
        "Berberine", "Green Tea Extract (EGCG)", "Chromium Picolinate",
        "CLA", "Alpha-Lipoic Acid", "Inositol",
        "Fiber (Glucomannan)", "L-Carnitine", "Cayenne Extract", "Omega-3 Fish Oil",
    ],
    "muscle_recovery": [
        "Creatine Monohydrate", "Protein Powder (Whey/Plant)", "Magnesium Glycinate",
        "Tart Cherry Extract", "HMB", "Omega-3 Fish Oil",
        "L-Glutamine", "BCAAs", "Collagen Peptides", "Vitamin D3",
    ],
    "cardiovascular": [
        "Omega-3 Fish Oil", "CoQ10 (Ubiquinol)", "Magnesium Glycinate",
        "Vitamin K2 MK-7", "Garlic Extract", "Berberine",
        "Resveratrol", "Niacin", "Pomegranate Extract", "Taurine",
    ],
    "hormonal_balance": [
        "Vitamin D3", "Zinc Picolinate", "Magnesium Glycinate",
        "Ashwagandha (KSM-66)", "DIM", "Boron",
        "Maca Root", "Tongkat Ali", "Selenium", "Omega-3 Fish Oil",
    ],
    "longevity": _LONGEVITY_ESSENTIALS,
}


@dataclass(slots=True)
class CatalogSnapshot:
    supplements: list[dict]
    medications: list[dict]
    therapies: list[dict]
    peptides: list[dict]


def _supplement_to_dict(s: Supplement) -> dict:
    return {
        "id": str(s.id),
        "name": s.name,
        "category": s.category.value if hasattr(s.category, "value") else str(s.category),
        "form": s.form,
        "goals": s.goals or [],
        "mechanism_tags": s.mechanism_tags or [],
        "description": s.description or "",
    }


def _medication_to_dict(m: Medication) -> dict:
    return {
        "id": str(m.id),
        "name": m.name,
        "category": m.category.value if hasattr(m.category, "value") else str(m.category),
        "form": m.form,
        "description": m.description or "",
    }


def _therapy_to_dict(t: Therapy) -> dict:
    return {
        "id": str(t.id),
        "name": t.name,
        "category": t.category.value if hasattr(t.category, "value") else str(t.category),
        "description": t.description or "",
    }


def _peptide_to_dict(p: Peptide) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "category": p.category.value if hasattr(p.category, "value") else str(p.category),
        "form": p.form,
        "goals": p.goals or [],
        "description": p.description or "",
    }


# ── Static fallback ─────────────────────────────────────────────────────────

def _find_synergy_partners(current_names: list[str]) -> dict[str, str]:
    """Map candidate names → synergy reason based on what the user already takes."""
    current_lower = {n.lower() for n in current_names}
    partners: dict[str, str] = {}  # candidate name (lower) → reason
    for name_a, name_b, benefit in KNOWN_SYNERGIES:
        if name_a.lower() in current_lower and name_b.lower() not in current_lower:
            partners[name_b.lower()] = f"Synergy with {name_a}: {benefit}"
        elif name_b.lower() in current_lower and name_a.lower() not in current_lower:
            partners[name_a.lower()] = f"Synergy with {name_b}: {benefit}"
    return partners


def static_recommendations(
    *,
    catalog: CatalogSnapshot,
    goals: list[str],
    max_items: int,
    exclude_ids: set[str],
    item_types: list[str],
    current_item_names: list[str] | None = None,
) -> list[dict]:
    """Rank catalog items using the static priority tiers. No AI needed."""
    priority_list: list[str] = []
    for goal in goals:
        priority_list.extend(_GOAL_PRIORITIES.get(goal, []))
    if not priority_list:
        priority_list = _LONGEVITY_ESSENTIALS[:]

    # Dedupe while preserving order
    seen: set[str] = set()
    ordered_names: list[str] = []
    for name in priority_list:
        lower = name.lower()
        if lower not in seen:
            seen.add(lower)
            ordered_names.append(name)

    # Build name → catalog entry lookup
    catalog_by_name: dict[str, dict] = {}
    if "supplement" in item_types:
        for s in catalog.supplements:
            catalog_by_name[s["name"].lower()] = {**s, "item_type": "supplement"}
    if "medication" in item_types:
        for m in catalog.medications:
            catalog_by_name[m["name"].lower()] = {**m, "item_type": "medication"}
    if "therapy" in item_types:
        for t in catalog.therapies:
            catalog_by_name[t["name"].lower()] = {**t, "item_type": "therapy"}
    if "peptide" in item_types:
        for p in catalog.peptides:
            catalog_by_name[p["name"].lower()] = {**p, "item_type": "peptide"}

    # Identify synergy partners with the user's current stack
    synergy_partners = _find_synergy_partners(current_item_names or [])

    # Boost synergy partners: prepend them to the priority list if not already high
    synergy_boosted: list[str] = []
    for candidate_lower, _reason in synergy_partners.items():
        if candidate_lower not in seen and candidate_lower in catalog_by_name:
            synergy_boosted.append(catalog_by_name[candidate_lower]["name"])
            seen.add(candidate_lower)

    # Synergy items go first, then the goal-priority list
    final_order = synergy_boosted + ordered_names

    results: list[dict] = []
    for rank, name in enumerate(final_order, 1):
        if len(results) >= max_items:
            break
        entry = catalog_by_name.get(name.lower())
        if entry is None:
            continue
        if entry["id"] in exclude_ids:
            continue
        synergy_reason = synergy_partners.get(name.lower())
        if synergy_reason:
            reason = f"{synergy_reason} — also top-ranked for {', '.join(goals) or 'general longevity'}"
        else:
            reason = f"Top-ranked for {', '.join(goals) or 'general longevity'} (evidence-based priority #{rank})"
        results.append({
            "catalog_id": entry["id"],
            "item_type": entry["item_type"],
            "name": entry["name"],
            "category": entry.get("category", "other"),
            "reason": reason,
            "priority_rank": len(results) + 1,
            "suggested_dosage": None,
            "suggested_window": None,
        })

    return results


# ── Claude-powered recommendations ──────────────────────────────────────────

def _build_recommendation_prompt(
    *,
    preferences: UserPreferences | None,
    goals: list[str],
    focus_concern: str | None,
    max_items: int,
    item_types: list[str],
    catalog: CatalogSnapshot,
    current_item_names: list[str],
) -> str:
    goal_text = ", ".join(goals) if goals else "general longevity and health optimization"
    concern_text = f"\n\nSpecific concern: {focus_concern}" if focus_concern else ""

    profile_lines = []
    if preferences:
        if preferences.age:
            profile_lines.append(f"Age: {preferences.age}")
        if preferences.biological_sex:
            profile_lines.append(f"Biological sex: {preferences.biological_sex}")
        if preferences.max_tablets_per_day:
            profile_lines.append(f"Max tablets/capsules per day: {preferences.max_tablets_per_day}")
        if preferences.exercise_blocks_per_week is not None:
            profile_lines.append(f"Exercise blocks per week: {preferences.exercise_blocks_per_week}")
        if preferences.exercise_minutes_per_day is not None:
            profile_lines.append(f"Exercise minutes per day: {preferences.exercise_minutes_per_day}")
        if preferences.excluded_ingredients:
            profile_lines.append(f"Excluded ingredients/allergies: {', '.join(preferences.excluded_ingredients)}")
        if preferences.notes:
            profile_lines.append(f"Additional notes: {preferences.notes}")
    profile_section = "\n".join(profile_lines) if profile_lines else "No profile details available."

    current_section = ""
    if current_item_names:
        synergy_hints = _find_synergy_partners(current_item_names)
        synergy_text = ""
        if synergy_hints:
            synergy_lines = [f"  - {name}: {reason}" for name, reason in synergy_hints.items()]
            synergy_text = "\n\nKNOWN SYNERGIES with current stack (boost these if available in catalog):\n" + "\n".join(synergy_lines)
        current_section = f"\n\nUser currently takes: {', '.join(current_item_names)}\nDo NOT recommend these. Consider synergies and avoid redundancy.{synergy_text}"

    catalog_sections = []
    if "supplement" in item_types and catalog.supplements:
        catalog_sections.append("SUPPLEMENTS:\n" + json.dumps(catalog.supplements, indent=None))
    if "medication" in item_types and catalog.medications:
        catalog_sections.append("MEDICATIONS:\n" + json.dumps(catalog.medications, indent=None))
    if "therapy" in item_types and catalog.therapies:
        catalog_sections.append("THERAPIES:\n" + json.dumps(catalog.therapies, indent=None))
    if "peptide" in item_types and catalog.peptides:
        catalog_sections.append("PEPTIDES:\n" + json.dumps(catalog.peptides, indent=None))

    return f"""You are a health protocol advisor. Recommend exactly {max_items} items from the catalog below, ranked by priority for this user.

USER PROFILE:
{profile_section}

GOALS: {goal_text}{concern_text}{current_section}

AVAILABLE CATALOG:
{chr(10).join(catalog_sections)}

INSTRUCTIONS:
- Pick exactly {max_items} items, ranked #1 = most impactful
- For each item, explain WHY it's recommended for this user's goals in 1-2 sentences
- If recommending supplements, suggest a dosage and take window (morning_fasted, morning_with_food, midday, afternoon, evening, bedtime)
- Prioritize items with strong evidence and broad benefit
- Consider synergies between your picks (e.g., Vitamin D + K2, Omega-3 + Curcumin)
- Avoid items the user already takes or has excluded
- For specific concerns, shift ranking toward targeted items

Return ONLY valid JSON — no markdown, no explanation outside the JSON:
{{
  "items": [
    {{
      "catalog_id": "<uuid from catalog>",
      "item_type": "supplement|medication|therapy|peptide",
      "name": "<exact name from catalog>",
      "category": "<category>",
      "reason": "<1-2 sentence explanation>",
      "priority_rank": 1,
      "suggested_dosage": "<e.g., 2000 IU daily>",
      "suggested_window": "<take window or null>"
    }}
  ],
  "reasoning_summary": "<2-3 sentence overall rationale for this stack>"
}}"""


class _AIRecommendation(BaseModel):
    catalog_id: str
    item_type: str
    name: str
    category: str
    reason: str
    priority_rank: int
    suggested_dosage: str | None = None
    suggested_window: str | None = None

    model_config = ConfigDict(extra="ignore")


class _AIRecommendationResponse(BaseModel):
    items: list[_AIRecommendation]
    reasoning_summary: str

    model_config = ConfigDict(extra="ignore")


def generate_recommendations(
    *,
    preferences: UserPreferences | None,
    goals: list[str],
    focus_concern: str | None,
    max_items: int,
    item_types: list[str],
    catalog: CatalogSnapshot,
    current_item_names: list[str],
    exclude_ids: set[str],
) -> tuple[list[dict], str]:
    """Call Claude to generate ranked recommendations. Returns (items, reasoning_summary)."""
    prompt = _build_recommendation_prompt(
        preferences=preferences,
        goals=goals,
        focus_concern=focus_concern,
        max_items=max_items,
        item_types=item_types,
        catalog=catalog,
        current_item_names=current_item_names,
    )

    try:
        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.ai_model,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.content[0].text.strip()
        parsed = _AIRecommendationResponse.model_validate_json(raw_text)

        # Filter out excluded IDs and rerank
        items: list[dict] = []
        for item in parsed.items:
            if item.catalog_id in exclude_ids:
                continue
            items.append(item.model_dump())

        for idx, item in enumerate(items, 1):
            item["priority_rank"] = idx

        return items[:max_items], parsed.reasoning_summary

    except Exception as e:
        logger.warning("AI recommendation failed, falling back to static: %s", e)
        items = static_recommendations(
            catalog=catalog,
            goals=goals,
            max_items=max_items,
            exclude_ids=exclude_ids,
            item_types=item_types,
            current_item_names=current_item_names,
        )
        return items, f"Recommendations based on evidence-based priority ranking for {', '.join(goals) or 'general longevity'}."
