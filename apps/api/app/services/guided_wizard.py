"""Guided Wizard — AI-driven conversational protocol builder.

The wizard runs a multi-turn conversation where Claude asks the user
questions about their health goals, constraints, and preferences, then
produces a complete protocol recommendation.

State is client-managed: each response returns the full conversation
history so the client can POST it back on the next turn.
"""

from __future__ import annotations

import logging

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover - optional dependency in local dev/test
    Anthropic = None

from app.config import settings
from app.services.guided_wizard_fallback import (
    build_completion_message,
    infer_preferences,
    parse_completion_payload,
    static_fallback,
)
from app.services.guided_wizard_prompting import build_system_with_catalog
from app.services.guided_wizard_types import WizardResult, WizardTurn
from app.services.recommendation_engine import CatalogSnapshot

logger = logging.getLogger(__name__)


def run_wizard_turn(
    *,
    conversation: list[WizardTurn],
    user_message: str,
    catalog: CatalogSnapshot,
) -> WizardResult:
    """Process one turn of the guided wizard conversation."""
    system = build_system_with_catalog(catalog)
    inferred = infer_preferences(conversation, user_message)
    completion_payload: dict | None = None

    # Build messages for Claude
    messages = []
    for turn in conversation:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": user_message})

    try:
        if Anthropic is None:
            raise RuntimeError("Anthropic SDK not installed")
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
        fallback_result = static_fallback(conversation, user_message, catalog)
        if isinstance(fallback_result, dict):
            completion_payload = fallback_result
            assistant_text = build_completion_message(fallback_result)
        else:
            assistant_text = fallback_result

    if completion_payload is None:
        completion_payload = parse_completion_payload(assistant_text, inferred, catalog)
        if completion_payload is not None:
            assistant_text = build_completion_message(completion_payload)

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

    if completion_payload is not None:
        is_complete = True
        extracted_prefs = completion_payload.get("preferences", {})
        recommended_items = completion_payload.get("recommended_items", [])
        protocol_name = completion_payload.get("protocol_name")
        summary = completion_payload.get("summary")

    return WizardResult(
        assistant_message=assistant_text,
        conversation=new_conversation,
        is_complete=is_complete,
        extracted_preferences=extracted_prefs,
        recommended_items=recommended_items,
        protocol_name=protocol_name,
        summary=summary,
    )
