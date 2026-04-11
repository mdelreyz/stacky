from __future__ import annotations

import json
import re

from app.services.guided_wizard_types import WizardTurn
from app.services.recommendation_engine import CatalogSnapshot, static_recommendations

_GOAL_ALIASES: dict[str, tuple[str, ...]] = {
    "longevity": ("longevity", "healthspan", "lifespan", "anti aging", "anti-aging"),
    "cognitive": ("cognitive", "brain", "focus", "memory", "mental performance", "mental clarity"),
    "sleep": ("sleep", "insomnia", "bedtime"),
    "stress": ("stress", "anxiety", "calm", "relaxation", "cortisol"),
    "energy": ("energy", "fatigue", "tired", "stamina"),
    "immunity": ("immunity", "immune", "immune strength", "immnue"),
    "skin": ("skin", "glow", "acne"),
    "hair": ("hair", "hair loss", "thinning"),
    "joint_health": ("joint", "joint pain", "mobility"),
    "gut_health": ("gut", "digestion", "bloating", "microbiome"),
    "weight_management": ("weight", "fat loss", "appetite", "metabolic"),
    "muscle_recovery": ("recovery", "training", "muscle", "gym"),
    "cardiovascular": ("cardiovascular", "heart", "blood pressure", "cholesterol"),
    "hormonal_balance": ("hormonal", "hormone", "testosterone", "estrogen"),
}

_CONCERN_ALIASES: dict[str, tuple[str, ...]] = {
    "brain fog": ("brain fog",),
    "fatigue": ("fatigue", "low energy", "tired"),
    "joint pain": ("joint pain", "aches"),
    "immune strength": ("immune strength", "immunity", "immune", "immnue"),
    "sleep quality": ("poor sleep", "sleep quality", "fall asleep", "stay asleep"),
    "stress resilience": ("stress", "anxiety", "resilience"),
    "recovery": ("recovery", "soreness", "training"),
}

_GENERAL_OPTIMIZATION_PHRASES = (
    "general",
    "nothing specific",
    "no specific",
    "no particular",
    "just optimize",
    "general optimization",
)

_NO_EXCLUSION_PHRASES = (
    "no allergies",
    "no allergy",
    "no exclusions",
    "no ingredients to avoid",
    "nothing to avoid",
    "none",
)

_DOSAGE_HINTS: dict[str, tuple[str | None, str | None]] = {
    "Omega-3 Fish Oil": ("2 g daily", "morning_with_food"),
    "Vitamin D3": ("2000 IU daily", "morning_with_food"),
    "Magnesium Glycinate": ("300-400 mg daily", "evening"),
    "Creatine Monohydrate": ("3-5 g daily", "morning_with_food"),
    "Vitamin K2 MK-7": ("100-200 mcg daily", "morning_with_food"),
    "CoQ10 (Ubiquinol)": ("100-200 mg daily", "morning_with_food"),
    "Lion's Mane Mushroom": ("500-1000 mg daily", "morning_with_food"),
    "L-Theanine": ("100-200 mg daily", "afternoon"),
}


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9+ ]+", " ", text.lower())).strip()


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            output.append(value)
    return output


def _catalog_entries(catalog: CatalogSnapshot) -> list[dict]:
    entries: list[dict] = []
    for item in catalog.supplements:
        entries.append({**item, "item_type": "supplement"})
    for item in catalog.medications:
        entries.append({**item, "item_type": "medication"})
    for item in catalog.therapies:
        entries.append({**item, "item_type": "therapy"})
    for item in catalog.peptides:
        entries.append({**item, "item_type": "peptide"})
    return entries


def _goals_in_text(text: str) -> list[str]:
    normalized = _normalize_text(text)
    return [
        goal
        for goal, aliases in _GOAL_ALIASES.items()
        if any(alias in normalized for alias in aliases)
    ]


def _extract_goals(texts: list[str]) -> list[str]:
    goals: list[str] = []
    for index, text in enumerate(texts):
        matched_goals = _goals_in_text(text)
        if not matched_goals:
            continue

        normalized = _normalize_text(text)
        looks_like_goal_answer = (
            index == 0
            or not goals
            or any(
                phrase in normalized
                for phrase in ("goal", "goals", "optimize", "optimise", "want", "improve", "focus on", "help me")
            )
        )
        if looks_like_goal_answer:
            goals.extend(matched_goals)

    return _dedupe(goals)


def _extract_focus_concerns(texts: list[str]) -> list[str]:
    concerns: list[str] = []
    normalized_texts = [_normalize_text(text) for text in texts]
    for concern, aliases in _CONCERN_ALIASES.items():
        if any(alias in text for text in normalized_texts for alias in aliases):
            concerns.append(concern)
    return concerns


def _extract_limit(texts: list[str]) -> tuple[int | None, bool]:
    for text in reversed(texts):
        lowered = text.lower()
        if any(phrase in lowered for phrase in ("no limit", "unlimited", "as many as needed", "whatever it takes")):
            return None, True
        match = re.search(r"\b(\d{1,3})\b", lowered)
        if match:
            return min(int(match.group(1)), 100), True
    return None, False


def _extract_exclusions(texts: list[str]) -> tuple[list[str], bool]:
    exclusions: list[str] = []
    answered = False
    for text in texts:
        lowered = text.lower()
        normalized = _normalize_text(text)
        if any(phrase in normalized for phrase in _NO_EXCLUSION_PHRASES):
            answered = True
            continue

        for pattern in (
            r"(?:allerg(?:y|ies)|avoid|exclude|excluding)\s+(?:to\s+)?(.+)$",
            r"no\s+(.+?)\s+please$",
        ):
            match = re.search(pattern, lowered)
            if not match:
                continue
            answered = True
            raw = match.group(1)
            raw = re.sub(r"\b(?:and|or)\b", ",", raw)
            for part in raw.split(","):
                cleaned = part.strip(" .")
                if cleaned and cleaned not in {"it", "them"}:
                    exclusions.append(cleaned)

    return _dedupe(exclusions), answered


def _extract_age(texts: list[str]) -> int | None:
    for text in reversed(texts):
        match = re.search(r"\b(?:age|aged|i am|i'm)\s+(\d{1,3})\b", text.lower())
        if match:
            return max(13, min(int(match.group(1)), 120))
    return None


def _extract_biological_sex(texts: list[str]) -> str | None:
    normalized_texts = [_normalize_text(text) for text in texts]
    for text in reversed(normalized_texts):
        if "female" in text or "woman" in text:
            return "female"
        if "male" in text or "man" in text:
            return "male"
        if "other" in text or "nonbinary" in text or "non binary" in text:
            return "other"
    return None


def _wants_general_optimization(texts: list[str]) -> bool:
    normalized_texts = [_normalize_text(text) for text in texts]
    return any(phrase in text for text in normalized_texts for phrase in _GENERAL_OPTIMIZATION_PHRASES)


def infer_preferences(conversation: list[WizardTurn], user_message: str) -> dict:
    user_texts = [turn.content for turn in conversation if turn.role == "user"] + [user_message]
    goals = _extract_goals(user_texts)
    concerns = _extract_focus_concerns(user_texts)
    pill_limit, pill_limit_answered = _extract_limit(user_texts)
    exclusions, exclusions_answered = _extract_exclusions(user_texts)
    general_optimization = _wants_general_optimization(user_texts)

    return {
        "primary_goals": goals,
        "max_supplements_per_day": pill_limit,
        "max_tablets_per_day": pill_limit,
        "excluded_ingredients": exclusions,
        "age": _extract_age(user_texts),
        "biological_sex": _extract_biological_sex(user_texts),
        "focus_concerns": concerns,
        "notes": f"Built via guided wizard. User responses collected over {len(user_texts)} turns.",
        "_has_pill_limit_answer": pill_limit_answered,
        "_has_exclusion_answer": exclusions_answered,
        "_has_concern_answer": general_optimization or bool(concerns),
        "_general_optimization": general_optimization,
    }


def _format_goal_label(goal: str) -> str:
    return goal.replace("_", " ")


def build_follow_up_question(inferred: dict) -> str | None:
    goals: list[str] = inferred["primary_goals"]
    if not goals:
        return (
            "What are your primary health goals? "
            "For example: longevity, sleep, energy, immunity, or cognitive performance."
        )

    if not inferred["_has_pill_limit_answer"] or not inferred["_has_exclusion_answer"]:
        goal_text = ", ".join(_format_goal_label(goal) for goal in goals[:2])
        return (
            f"Got it: {goal_text}. How many pills or capsules per day feels reasonable, "
            "and is there anything you want to avoid?"
        )

    if not inferred["_has_concern_answer"]:
        return (
            "Any specific concern to emphasize, "
            "or should I optimize for your general goals?"
        )

    return None


def _normalize_preferences(parsed_preferences: dict | None, inferred: dict) -> dict:
    parsed_preferences = parsed_preferences or {}
    parsed_goals = [
        goal for goal in parsed_preferences.get("primary_goals", [])
        if goal in _GOAL_ALIASES
    ]
    parsed_concerns = [
        str(concern).strip() for concern in parsed_preferences.get("focus_concerns", [])
        if str(concern).strip()
    ]
    parsed_exclusions = [
        str(item).strip() for item in parsed_preferences.get("excluded_ingredients", [])
        if str(item).strip()
    ]

    max_supplements = inferred.get("max_supplements_per_day")
    if max_supplements is None:
        max_supplements = parsed_preferences.get("max_supplements_per_day")
    if isinstance(max_supplements, int):
        max_supplements = min(max(max_supplements, 1), 100)

    max_tablets = inferred.get("max_tablets_per_day")
    if max_tablets is None:
        max_tablets = parsed_preferences.get("max_tablets_per_day")
    if isinstance(max_tablets, int):
        max_tablets = min(max(max_tablets, 1), 100)

    return {
        "primary_goals": _dedupe(parsed_goals + inferred["primary_goals"]) or ["longevity"],
        "max_supplements_per_day": max_supplements,
        "max_tablets_per_day": max_tablets,
        "excluded_ingredients": _dedupe(parsed_exclusions + inferred["excluded_ingredients"]),
        "age": inferred.get("age") or parsed_preferences.get("age"),
        "biological_sex": inferred.get("biological_sex") or parsed_preferences.get("biological_sex"),
        "focus_concerns": _dedupe(parsed_concerns + inferred["focus_concerns"]),
        "notes": parsed_preferences.get("notes") or inferred["notes"],
    }


def _normalize_recommended_items(items: list[dict] | None, catalog: CatalogSnapshot) -> list[dict]:
    if not items:
        return []

    catalog_entries = _catalog_entries(catalog)
    catalog_by_id = {entry["id"]: entry for entry in catalog_entries}
    catalog_by_name = {entry["name"].lower(): entry for entry in catalog_entries}

    normalized: list[dict] = []
    seen_catalog_ids: set[str] = set()
    for item in items:
        if not isinstance(item, dict):
            continue

        catalog_match = None
        catalog_id = item.get("catalog_id")
        name = str(item.get("name", "")).strip()
        if isinstance(catalog_id, str):
            catalog_match = catalog_by_id.get(catalog_id)
        if catalog_match is None and name:
            catalog_match = catalog_by_name.get(name.lower())
        if catalog_match is None or catalog_match["id"] in seen_catalog_ids:
            continue

        seen_catalog_ids.add(catalog_match["id"])
        normalized.append({
            "catalog_id": catalog_match["id"],
            "name": catalog_match["name"],
            "item_type": catalog_match["item_type"],
            "reason": str(item.get("reason") or f"Recommended for your {_format_goal_label(catalog_match['item_type'])} plan."),
            "suggested_dosage": item.get("suggested_dosage"),
            "suggested_window": item.get("suggested_window"),
        })

    return normalized


def _fallback_recommended_items(preferences: dict, catalog: CatalogSnapshot) -> list[dict]:
    goals = preferences["primary_goals"] or ["longevity"]
    max_items = min(max(preferences.get("max_supplements_per_day") or 3, 1), 4)
    items = static_recommendations(
        catalog=catalog,
        goals=goals,
        max_items=max_items,
        exclude_ids=set(),
        item_types=["supplement"],
        current_item_names=[],
    )

    if not items:
        items = [
            {
                "catalog_id": entry["id"],
                "name": entry["name"],
                "item_type": "supplement",
                "reason": "A strong foundational option from the current catalog.",
                "suggested_dosage": None,
                "suggested_window": None,
            }
            for entry in catalog.supplements[:max_items]
        ]

    normalized: list[dict] = []
    for item in items[:max_items]:
        dosage_hint, window_hint = _DOSAGE_HINTS.get(item["name"], (None, None))
        normalized.append({
            "catalog_id": item["catalog_id"],
            "name": item["name"],
            "item_type": item["item_type"],
            "reason": item["reason"],
            "suggested_dosage": item.get("suggested_dosage") or dosage_hint,
            "suggested_window": item.get("suggested_window") or window_hint,
        })
    return normalized


def _build_protocol_name(preferences: dict) -> str:
    goals = preferences["primary_goals"]
    concerns = preferences["focus_concerns"]
    if goals:
        label = " + ".join(_format_goal_label(goal).title() for goal in goals[:2])
    else:
        label = "Personalized"
    if concerns:
        return f"{label} Support"
    return f"{label} Foundation"


def _build_summary(preferences: dict, recommended_items: list[dict]) -> str:
    goals = preferences["primary_goals"]
    concerns = preferences["focus_concerns"]
    goal_text = ", ".join(_format_goal_label(goal) for goal in goals[:2]) or "general health"
    concern_text = ""
    if concerns:
        concern_text = f" with extra attention to {', '.join(concerns[:2])}"
    return (
        f"A focused stack built around {goal_text}{concern_text}. "
        f"It keeps the protocol concise with {len(recommended_items)} evidence-weighted items from your catalog."
    )


def _build_completion_payload(inferred: dict, catalog: CatalogSnapshot) -> dict:
    preferences = _normalize_preferences(None, inferred)
    recommended_items = _fallback_recommended_items(preferences, catalog)
    protocol_name = _build_protocol_name(preferences)
    return {
        "wizard_complete": True,
        "preferences": preferences,
        "recommended_items": recommended_items,
        "protocol_name": protocol_name,
        "summary": _build_summary(preferences, recommended_items),
    }


def build_completion_message(payload: dict) -> str:
    protocol_name = payload.get("protocol_name")
    if protocol_name:
        return f"I've built your {protocol_name} draft. Review the stack below and add it if it looks right."
    return "I've built a draft protocol. Review the stack below and add it if it looks right."


def parse_completion_payload(assistant_text: str, inferred: dict, catalog: CatalogSnapshot) -> dict | None:
    try:
        parsed = json.loads(assistant_text)
    except (json.JSONDecodeError, TypeError):
        return None

    if not isinstance(parsed, dict) or not parsed.get("wizard_complete"):
        return None

    preferences = _normalize_preferences(parsed.get("preferences"), inferred)
    recommended_items = _normalize_recommended_items(parsed.get("recommended_items"), catalog)
    if not recommended_items:
        recommended_items = _fallback_recommended_items(preferences, catalog)

    return {
        "wizard_complete": True,
        "preferences": preferences,
        "recommended_items": recommended_items,
        "protocol_name": parsed.get("protocol_name") or _build_protocol_name(preferences),
        "summary": parsed.get("summary") or _build_summary(preferences, recommended_items),
    }


def static_fallback(conversation: list[WizardTurn], user_message: str, catalog: CatalogSnapshot) -> str | dict:
    """Provide a question-by-question fallback when Claude is unavailable."""
    inferred = infer_preferences(conversation, user_message)
    next_question = build_follow_up_question(inferred)
    if next_question is not None:
        return next_question
    return _build_completion_payload(inferred, catalog)
