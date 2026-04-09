"""Guided Wizard — AI-driven conversational protocol builder.

The wizard runs a multi-turn conversation where Claude asks the user
questions about their health goals, constraints, and preferences, then
produces a complete protocol recommendation.

State is client-managed: each response returns the full conversation
history so the client can POST it back on the next turn.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field

from anthropic import Anthropic
from pydantic import BaseModel, ConfigDict

from app.config import settings
from app.services.recommendation_engine import CatalogSnapshot

logger = logging.getLogger(__name__)

# ── Wizard system prompt ──────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are a health protocol wizard for an app called Protocols. Your job is to \
guide the user through building a personalized supplement/therapy stack via a \
friendly, concise conversation.

RULES:
1. Ask ONE question at a time. Keep each message under 3 sentences.
2. Start by asking about their primary health goals (pick from: longevity, \
cognitive, sleep, stress, energy, immunity, skin, hair, joint_health, \
gut_health, weight_management, muscle_recovery, cardiovascular, hormonal_balance).
3. Then ask about constraints: max pills per day, any excluded ingredients or \
allergies, age, biological sex (optional).
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
"""


def _build_system_with_catalog(catalog: CatalogSnapshot) -> str:
    """Append the catalog data to the system prompt."""
    sections = []
    if catalog.supplements:
        names = [s["name"] for s in catalog.supplements]
        sections.append("SUPPLEMENTS: " + ", ".join(names))
    if catalog.medications:
        names = [m["name"] for m in catalog.medications]
        sections.append("MEDICATIONS: " + ", ".join(names))
    if catalog.therapies:
        names = [t["name"] for t in catalog.therapies]
        sections.append("THERAPIES: " + ", ".join(names))
    if catalog.peptides:
        names = [p["name"] for p in catalog.peptides]
        sections.append("PEPTIDES: " + ", ".join(names))

    catalog_text = "\n".join(sections) if sections else "No catalog items available."
    return _SYSTEM_PROMPT + f"\n\nCATALOG:\n{catalog_text}"


@dataclass(slots=True)
class WizardTurn:
    role: str  # "user" or "assistant"
    content: str


@dataclass(slots=True)
class WizardResult:
    assistant_message: str
    conversation: list[WizardTurn]
    is_complete: bool
    # Populated only when is_complete=True
    extracted_preferences: dict | None = None
    recommended_items: list[dict] | None = None
    protocol_name: str | None = None
    summary: str | None = None


def run_wizard_turn(
    *,
    conversation: list[WizardTurn],
    user_message: str,
    catalog: CatalogSnapshot,
) -> WizardResult:
    """Process one turn of the guided wizard conversation."""
    system = _build_system_with_catalog(catalog)

    # Build messages for Claude
    messages = []
    for turn in conversation:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": user_message})

    try:
        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.ai_model,
            max_tokens=2048,
            system=system,
            messages=messages,
        )
        assistant_text = response.content[0].text.strip()
    except Exception as e:
        logger.warning("Wizard AI call failed: %s", e)
        assistant_text = _static_fallback(conversation, user_message)

    # Update conversation history
    new_conversation = list(conversation)
    new_conversation.append(WizardTurn(role="user", content=user_message))
    new_conversation.append(WizardTurn(role="assistant", content=assistant_text))

    # Check if the assistant produced a final JSON recommendation
    is_complete = False
    extracted_prefs = None
    recommended_items = None
    protocol_name = None
    summary = None

    try:
        parsed = json.loads(assistant_text)
        if isinstance(parsed, dict) and parsed.get("wizard_complete"):
            is_complete = True
            extracted_prefs = parsed.get("preferences", {})
            recommended_items = parsed.get("recommended_items", [])
            protocol_name = parsed.get("protocol_name")
            summary = parsed.get("summary")
    except (json.JSONDecodeError, TypeError):
        pass

    return WizardResult(
        assistant_message=assistant_text,
        conversation=new_conversation,
        is_complete=is_complete,
        extracted_preferences=extracted_prefs,
        recommended_items=recommended_items,
        protocol_name=protocol_name,
        summary=summary,
    )


# ── Static fallback (no API key) ─────────────────────────────────────────────

_STATIC_QUESTIONS = [
    "Welcome! I'm here to help you build a personalized supplement protocol. What are your primary health goals? (e.g., longevity, better sleep, more energy, cognitive performance)",
    "Great! How many pills or capsules are you comfortable taking per day? And do you have any allergies or ingredients to avoid?",
    "Last question — do you have a specific concern you'd like to address? (e.g., brain fog, joint pain, fatigue) Or should I optimize for your general goals?",
]


def _static_fallback(conversation: list[WizardTurn], user_message: str) -> str:
    """Provide scripted questions when Claude is unavailable."""
    # Count how many assistant messages we've sent so far
    assistant_count = sum(1 for t in conversation if t.role == "assistant")

    if assistant_count < len(_STATIC_QUESTIONS):
        return _STATIC_QUESTIONS[assistant_count]

    # After all questions answered, produce a simple default recommendation
    return json.dumps({
        "wizard_complete": True,
        "preferences": {
            "primary_goals": ["longevity"],
            "max_supplements_per_day": 5,
            "max_tablets_per_day": 10,
            "excluded_ingredients": [],
            "age": None,
            "biological_sex": None,
            "focus_concerns": [],
            "notes": f"Built via guided wizard. User responses collected over {assistant_count + 1} turns.",
        },
        "recommended_items": [
            {"name": "Omega-3 Fish Oil", "item_type": "supplement", "reason": "Foundation for cardiovascular and brain health", "suggested_dosage": "2g EPA/DHA daily", "suggested_window": "morning_with_food"},
            {"name": "Vitamin D3", "item_type": "supplement", "reason": "Essential for immunity and bone health — most people are deficient", "suggested_dosage": "5000 IU daily", "suggested_window": "morning_with_food"},
            {"name": "Magnesium Glycinate", "item_type": "supplement", "reason": "Supports sleep, muscle function, and 300+ enzymatic reactions", "suggested_dosage": "400mg daily", "suggested_window": "evening"},
        ],
        "protocol_name": "Longevity Essentials",
        "summary": "A foundational 3-supplement stack covering cardiovascular, immune, and recovery needs.",
    })
