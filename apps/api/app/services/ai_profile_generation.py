import json
from typing import Literal

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover - optional dependency in local dev/test
    Anthropic = None
from pydantic import BaseModel, ConfigDict, ValidationError

from app.config import settings
from app.models.medication import MedicationCategory
from app.models.supplement import SupplementCategory


class AIProfileGenerationError(RuntimeError):
    pass


def get_ai_unavailable_reason() -> str | None:
    if not settings.anthropic_api_key:
        return "AI profile generation is unavailable until the Anthropic API key is configured."
    if Anthropic is None:
        return "AI profile generation is unavailable because the Anthropic SDK is not installed."
    return None


class DosageRecommendation(BaseModel):
    amount: float
    unit: str
    frequency: str
    context: str

    model_config = ConfigDict(extra="forbid")


class BioavailabilityProfile(BaseModel):
    notes: str
    enhancers: list[str]
    inhibitors: list[str]

    model_config = ConfigDict(extra="forbid")


class HalfLifeProfile(BaseModel):
    hours: str
    notes: str

    model_config = ConfigDict(extra="forbid")


class TimingRecommendations(BaseModel):
    preferred_windows: list[str]
    avoid_windows: list[str]
    with_food: bool
    food_interactions: str
    notes: str

    model_config = ConfigDict(extra="forbid")


class CyclingPattern(BaseModel):
    on_weeks: int
    off_weeks: int

    model_config = ConfigDict(extra="forbid")


class CyclingRecommendations(BaseModel):
    suggested: bool
    typical_pattern: CyclingPattern | None
    rationale: str

    model_config = ConfigDict(extra="forbid")


class KnownInteraction(BaseModel):
    substance: str
    type: Literal["contraindication", "caution"]
    severity: Literal["critical", "major", "moderate", "minor"]
    description: str

    model_config = ConfigDict(extra="forbid")


class SynergyProfile(BaseModel):
    substance: str
    benefit: str
    mechanism: str

    model_config = ConfigDict(extra="forbid")


class SupplementAIProfile(BaseModel):
    common_names: list[str]
    category: SupplementCategory
    mechanism_of_action: str
    typical_dosages: list[DosageRecommendation]
    forms: list[str]
    bioavailability: BioavailabilityProfile
    half_life: HalfLifeProfile
    timing_recommendations: TimingRecommendations
    cycling_recommendations: CyclingRecommendations
    known_interactions: list[KnownInteraction]
    synergies: list[SynergyProfile]
    contraindications: list[str]
    side_effects: list[str]
    safety_notes: str
    evidence_quality: Literal["strong", "moderate", "limited", "emerging"]
    sources_summary: str

    model_config = ConfigDict(extra="forbid")


class MedicationAIProfile(BaseModel):
    common_names: list[str]
    category: MedicationCategory
    drug_class: str
    mechanism_of_action: str
    typical_dosages: list[DosageRecommendation]
    forms: list[str]
    bioavailability: BioavailabilityProfile
    half_life: HalfLifeProfile
    timing_recommendations: TimingRecommendations
    known_interactions: list[KnownInteraction]
    contraindications: list[str]
    side_effects: list[str]
    monitoring_notes: str
    safety_notes: str
    evidence_quality: Literal["strong", "moderate", "limited", "emerging"]
    sources_summary: str

    model_config = ConfigDict(extra="forbid")


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        first_newline = text.index("\n") if "\n" in text else len(text)
        text = text[first_newline + 1 :]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _generate_profile_from_schema(
    *,
    subject: str,
    prompt: str,
    schema_model: type[BaseModel],
    invalid_schema_message: str,
) -> dict:
    unavailable_reason = get_ai_unavailable_reason()
    if unavailable_reason:
        raise AIProfileGenerationError(unavailable_reason)

    schema_json = json.dumps(schema_model.model_json_schema(), indent=2)
    client = Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=settings.ai_model,
        max_tokens=2400,
        temperature=0.2,
        system=(
            f"You generate {subject} reference data for a health app. "
            "Return ONLY valid JSON that matches the provided schema. "
            "No markdown, no code fences, no explanation — just the JSON object."
        ),
        messages=[
            {
                "role": "user",
                "content": f"{prompt}\n\nJSON Schema to follow:\n{schema_json}",
            }
        ],
    )

    payload = _strip_code_fences(
        "".join(block.text for block in response.content if getattr(block, "type", None) == "text")
    )
    if not payload:
        raise AIProfileGenerationError("Anthropic returned an empty response.")

    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise AIProfileGenerationError("Anthropic returned invalid JSON.") from exc

    try:
        profile = schema_model.model_validate(parsed)
    except ValidationError as exc:
        raise AIProfileGenerationError(invalid_schema_message) from exc

    return profile.model_dump(mode="json")


def _build_supplement_prompt(name: str, category: str | None, form: str | None) -> str:
    category_line = category or "other"
    form_line = form or "unknown"
    return f"""
Generate a structured supplement profile for a health protocol management app.

Supplement name: {name}
Requested category: {category_line}
Requested form: {form_line}

Requirements:
- Use evidence-grounded, consumer-safe language.
- Keep every field populated. Use empty arrays when needed, never null except where the schema allows it.
- Prefer the allowed take windows only: morning_fasted, morning_with_food, midday, afternoon, evening, bedtime.
- Keep interaction and contraindication names machine-friendly with snake_case strings.
- If the exact branded form is unclear, infer a reasonable generic supplement profile.
- Do not mention that this content was AI-generated.
""".strip()


def generate_supplement_profile(name: str, category: str | None, form: str | None) -> dict:
    return _generate_profile_from_schema(
        subject="supplement",
        prompt=_build_supplement_prompt(name, category, form),
        schema_model=SupplementAIProfile,
        invalid_schema_message="Anthropic returned an invalid supplement profile schema.",
    )


def _build_medication_prompt(name: str, category: str | None, form: str | None) -> str:
    category_line = category or "other"
    form_line = form or "unknown"
    return f"""
Generate a structured medication profile for a health protocol management app.

Medication name: {name}
Requested category: {category_line}
Requested form: {form_line}

Requirements:
- Use evidence-grounded, clinician-facing language.
- Keep every field populated. Use empty arrays when needed, never null except where the schema allows it.
- Prefer the allowed take windows only: morning_fasted, morning_with_food, midday, afternoon, evening, bedtime.
- Keep interaction and contraindication names machine-friendly with snake_case strings.
- Include drug_class (e.g. "mTOR inhibitor", "biguanide", "alpha-glucosidase inhibitor").
- Include monitoring_notes with relevant lab markers and monitoring intervals.
- Do not mention that this content was AI-generated.
""".strip()


def generate_medication_profile(name: str, category: str | None, form: str | None) -> dict:
    return _generate_profile_from_schema(
        subject="medication",
        prompt=_build_medication_prompt(name, category, form),
        schema_model=MedicationAIProfile,
        invalid_schema_message="Anthropic returned an invalid medication profile schema.",
    )
