from __future__ import annotations

import json

from app.services.recommendation_engine import CatalogSnapshot

_SYSTEM_PROMPT = """\
You are a health protocol wizard for an app called Protocols. Your job is to \
guide the user through building a personalized supplement/therapy stack via a \
friendly, concise conversation.

RULES:
1. Ask ONE question at a time. Keep each message under 3 sentences.
2. Start by asking about their primary health goals (pick from: longevity, \
cognitive, sleep, stress, energy, immunity, skin, hair, joint_health, \
gut_health, weight_management, muscle_recovery, cardiovascular, hormonal_balance).
2a. If the user already answered goals, constraints, or concerns in the latest \
message, do not ask for them again. Only ask for the next missing detail.
3. Then ask about constraints: max pills per day, any excluded ingredients or \
allergies. If the USER PROFILE section below already provides age and/or \
biological_sex, do NOT ask for them — use the provided values. Only ask \
about age or sex if they are missing from the profile.
4. Ask about any specific concerns they want to address (e.g., "brain fog", \
"chronic fatigue", "joint pain").
5. After collecting enough info (usually 3-5 questions), produce a final \
recommendation by responding with ONLY a JSON block (no markdown fencing).
6. The JSON block must match this exact schema:
{
  "wizard_complete": true,
  "preferences": {
    "primary_goals": ["longevity", ...],
    "max_supplements_per_day": 5,
    "max_tablets_per_day": 10,
    "excluded_ingredients": [],
    "age": null,
    "biological_sex": null,
    "focus_concerns": [],
    "notes": ""
  },
  "recommended_items": [
    {
      "catalog_id": "Exact UUID From Catalog",
      "name": "Exact Name From Catalog",
      "item_type": "supplement",
      "reason": "1-2 sentence reason",
      "suggested_dosage": "e.g., 2000 IU daily",
      "suggested_window": "morning_with_food"
    }
  ],
  "protocol_name": "AI-suggested name for this protocol",
  "summary": "2-3 sentence summary of the overall rationale"
}
7. Only recommend items that appear in the CATALOG section below.
8. Be warm and encouraging but professional. No medical diagnoses.
9. If the user seems confused or wants to skip a question, provide a sensible default.
10. Use any known profile data (age, sex, goals, concerns, constraints) from \
the USER PROFILE section to personalize recommendations. Include known values \
in the final JSON output even if the user didn't mention them in conversation.
"""


def _build_user_profile_section(user_profile: dict | None) -> str:
    """Build a USER PROFILE section from known preference data."""
    if not user_profile:
        return ""

    parts = []
    if user_profile.get("age"):
        parts.append(f"age: {user_profile['age']}")
    if user_profile.get("biological_sex"):
        parts.append(f"biological_sex: {user_profile['biological_sex']}")
    if user_profile.get("primary_goals"):
        parts.append(f"primary_goals: {json.dumps(user_profile['primary_goals'])}")
    if user_profile.get("focus_concerns"):
        parts.append(f"focus_concerns: {json.dumps(user_profile['focus_concerns'])}")
    if user_profile.get("excluded_ingredients"):
        parts.append(f"excluded_ingredients: {json.dumps(user_profile['excluded_ingredients'])}")
    if user_profile.get("max_supplements_per_day") is not None:
        parts.append(f"max_supplements_per_day: {user_profile['max_supplements_per_day']}")
    if user_profile.get("max_tablets_per_day") is not None:
        parts.append(f"max_tablets_per_day: {user_profile['max_tablets_per_day']}")

    if not parts:
        return ""

    return "\n\nUSER PROFILE (already known — do not re-ask these):\n" + "\n".join(parts)


def build_system_with_catalog(catalog: CatalogSnapshot, user_profile: dict | None = None) -> str:
    """Append the catalog data and user profile to the system prompt."""
    sections = []
    if catalog.supplements:
        sections.append(
            "SUPPLEMENTS: "
            + json.dumps(
                [
                    {"catalog_id": s["id"], "name": s["name"], "category": s.get("category")}
                    for s in catalog.supplements
                ],
                separators=(",", ":"),
            )
        )
    if catalog.medications:
        sections.append(
            "MEDICATIONS: "
            + json.dumps(
                [
                    {"catalog_id": m["id"], "name": m["name"], "category": m.get("category")}
                    for m in catalog.medications
                ],
                separators=(",", ":"),
            )
        )
    if catalog.therapies:
        sections.append(
            "THERAPIES: "
            + json.dumps(
                [
                    {"catalog_id": t["id"], "name": t["name"], "category": t.get("category")}
                    for t in catalog.therapies
                ],
                separators=(",", ":"),
            )
        )
    if catalog.peptides:
        sections.append(
            "PEPTIDES: "
            + json.dumps(
                [
                    {"catalog_id": p["id"], "name": p["name"], "category": p.get("category")}
                    for p in catalog.peptides
                ],
                separators=(",", ":"),
            )
        )

    catalog_text = "\n".join(sections) if sections else "No catalog items available."
    profile_text = _build_user_profile_section(user_profile)
    return _SYSTEM_PROMPT + profile_text + f"\n\nCATALOG:\n{catalog_text}"
