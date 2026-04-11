from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class WizardTurn:
    role: str  # "user" or "assistant"
    content: str


@dataclass(slots=True)
class WizardResult:
    assistant_message: str
    conversation: list[WizardTurn]
    is_complete: bool
    extracted_preferences: dict | None = None
    recommended_items: list[dict] | None = None
    protocol_name: str | None = None
    summary: str | None = None
