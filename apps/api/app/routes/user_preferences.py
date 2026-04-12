import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_session
from app.models.medication import Medication
from app.models.peptide import Peptide
from app.models.supplement import Supplement
from app.models.therapy import Therapy
from app.models.user import User
from app.models.user_medication import UserMedication
from app.models.user_peptide import UserPeptide
from app.models.user_preferences import UserPreferences
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.schemas.user_preferences import (
    ApplyRecommendationsRequest,
    ApplyRecommendationsResponse,
    InteractionCheckResponse,
    InteractionPreviewRequest,
    InteractionWarning,
    RecommendationRequest,
    RecommendationResponse,
    RecommendedItem,
    ScoreDimensionResponse,
    StackScoreResponse,
    SynergyPairResponse,
    UserPreferencesCreate,
    UserPreferencesResponse,
    UserPreferencesUpdate,
    WizardRecommendedItem,
    WizardRequest,
    WizardResponse,
    WizardTurnSchema,
)
from app.services.guided_wizard import WizardTurn, run_wizard_turn
from app.services.interaction_checker import (
    build_item_dicts_for_checking,
    check_interactions,
)
from app.services.recommendation_application import apply_recommendations_to_user
from app.services.recommendation_engine import (
    CatalogSnapshot,
    _medication_to_dict,
    _peptide_to_dict,
    _supplement_to_dict,
    _therapy_to_dict,
    generate_recommendations,
)
from app.services.stack_score import compute_stack_score

router = APIRouter(prefix="/users/me/preferences", tags=["preferences"])


async def _get_or_none(session: AsyncSession, user_id: uuid.UUID) -> UserPreferences | None:
    result = await session.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=UserPreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    prefs = await _get_or_none(session, current_user.id)
    if prefs is None:
        raise HTTPException(status_code=404, detail="Preferences not set yet")
    return UserPreferencesResponse.model_validate(prefs)


@router.put("", response_model=UserPreferencesResponse, status_code=200)
async def upsert_preferences(
    data: UserPreferencesCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    prefs = await _get_or_none(session, current_user.id)
    if prefs is None:
        prefs = UserPreferences(user_id=current_user.id)
        session.add(prefs)

    for key, value in data.model_dump().items():
        setattr(prefs, key, value)

    await session.commit()
    await session.refresh(prefs)
    return UserPreferencesResponse.model_validate(prefs)


@router.patch("", response_model=UserPreferencesResponse)
async def update_preferences(
    data: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    prefs = await _get_or_none(session, current_user.id)
    if prefs is None:
        raise HTTPException(status_code=404, detail="Preferences not set yet")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prefs, key, value)

    await session.commit()
    await session.refresh(prefs)
    return UserPreferencesResponse.model_validate(prefs)


async def _load_catalog(session: AsyncSession, item_types: list[str]) -> CatalogSnapshot:
    supplements = []
    medications = []
    therapies = []
    peptides = []

    if "supplement" in item_types:
        result = await session.execute(
            select(Supplement)
            .where(Supplement.created_by_user_id.is_(None))
            .order_by(Supplement.name)
        )
        supplements = [_supplement_to_dict(s) for s in result.scalars().all()]
    if "medication" in item_types:
        result = await session.execute(select(Medication).order_by(Medication.name))
        medications = [_medication_to_dict(m) for m in result.scalars().all()]
    if "therapy" in item_types:
        result = await session.execute(select(Therapy).order_by(Therapy.name))
        therapies = [_therapy_to_dict(t) for t in result.scalars().all()]
    if "peptide" in item_types:
        result = await session.execute(select(Peptide).order_by(Peptide.name))
        peptides = [_peptide_to_dict(p) for p in result.scalars().all()]

    return CatalogSnapshot(
        supplements=supplements,
        medications=medications,
        therapies=therapies,
        peptides=peptides,
    )


async def _current_user_item_names_and_ids(
    session: AsyncSession, user_id: uuid.UUID, item_types: list[str]
) -> tuple[list[str], set[str]]:
    names: list[str] = []
    ids: set[str] = set()

    if "supplement" in item_types:
        result = await session.execute(
            select(UserSupplement)
            .options(selectinload(UserSupplement.supplement))
            .where(UserSupplement.user_id == user_id, UserSupplement.is_active.is_(True))
        )
        for us in result.scalars().all():
            names.append(us.supplement.name)
            ids.add(str(us.supplement_id))

    if "medication" in item_types:
        result = await session.execute(
            select(UserMedication)
            .options(selectinload(UserMedication.medication))
            .where(UserMedication.user_id == user_id, UserMedication.is_active.is_(True))
        )
        for um in result.scalars().all():
            names.append(um.medication.name)
            ids.add(str(um.medication_id))

    if "therapy" in item_types:
        result = await session.execute(
            select(UserTherapy)
            .options(selectinload(UserTherapy.therapy))
            .where(UserTherapy.user_id == user_id, UserTherapy.is_active.is_(True))
        )
        for ut in result.scalars().all():
            names.append(ut.therapy.name)
            ids.add(str(ut.therapy_id))

    if "peptide" in item_types:
        result = await session.execute(
            select(UserPeptide)
            .options(selectinload(UserPeptide.peptide))
            .where(UserPeptide.user_id == user_id, UserPeptide.is_active.is_(True))
        )
        for up in result.scalars().all():
            names.append(up.peptide.name)
            ids.add(str(up.peptide_id))

    return names, ids


async def _load_active_interaction_items(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    include_therapies: bool = False,
) -> tuple[list[UserSupplement], list[UserMedication], list[UserTherapy], list[UserPeptide]]:
    supplements_result = await session.execute(
        select(UserSupplement)
        .options(selectinload(UserSupplement.supplement))
        .where(UserSupplement.user_id == user_id, UserSupplement.is_active.is_(True))
    )
    medications_result = await session.execute(
        select(UserMedication)
        .options(selectinload(UserMedication.medication))
        .where(UserMedication.user_id == user_id, UserMedication.is_active.is_(True))
    )
    therapies_result = await session.execute(
        select(UserTherapy)
        .options(selectinload(UserTherapy.therapy))
        .where(UserTherapy.user_id == user_id, UserTherapy.is_active.is_(True))
    ) if include_therapies else None
    peptides_result = await session.execute(
        select(UserPeptide)
        .options(selectinload(UserPeptide.peptide))
        .where(UserPeptide.user_id == user_id, UserPeptide.is_active.is_(True))
    )

    return (
        list(supplements_result.scalars().all()),
        list(medications_result.scalars().all()),
        list(therapies_result.scalars().all()) if therapies_result is not None else [],
        list(peptides_result.scalars().all()),
    )


async def _load_preview_catalog_items_or_404(
    session: AsyncSession,
    items: list,
) -> tuple[list[Supplement], list[Medication], list[Therapy], list[Peptide]]:
    preview_supplements: list[Supplement] = []
    preview_medications: list[Medication] = []
    preview_therapies: list[Therapy] = []
    preview_peptides: list[Peptide] = []

    model_by_type = {
        "supplement": Supplement,
        "medication": Medication,
        "therapy": Therapy,
        "peptide": Peptide,
    }
    bucket_by_type = {
        "supplement": preview_supplements,
        "medication": preview_medications,
        "therapy": preview_therapies,
        "peptide": preview_peptides,
    }

    for item in items:
        model = model_by_type[item.item_type]
        result = await session.execute(select(model).where(model.id == item.catalog_id))
        catalog_item = result.scalar_one_or_none()
        if catalog_item is None:
            raise HTTPException(status_code=404, detail=f"{item.item_type.title()} not found")
        bucket_by_type[item.item_type].append(catalog_item)

    return preview_supplements, preview_medications, preview_therapies, preview_peptides


def _interaction_response(interactions: list) -> InteractionCheckResponse:
    return InteractionCheckResponse(
        warnings=[
            InteractionWarning(
                item_a=i.item_a,
                item_b=i.item_b,
                interaction_type=i.interaction_type,
                severity=i.severity,
                description=i.description,
            )
            for i in interactions
        ],
        has_critical=any(i.severity == "critical" for i in interactions),
        has_major=any(i.severity == "major" for i in interactions),
        total_warnings=len(interactions),
    )


@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    data: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    prefs = await _get_or_none(session, current_user.id)

    # Resolve goals: request override > user preferences > default longevity
    goals = data.goals or (prefs.primary_goals if prefs and prefs.primary_goals else None) or ["longevity"]

    # Resolve slot budget
    max_items = data.max_items
    if prefs and prefs.max_supplements_per_day and max_items > prefs.max_supplements_per_day:
        max_items = prefs.max_supplements_per_day

    catalog = await _load_catalog(session, data.item_types)

    current_names: list[str] = []
    exclude_ids: set[str] = set()
    items_excluded = 0
    if data.exclude_current:
        current_names, exclude_ids = await _current_user_item_names_and_ids(
            session, current_user.id, data.item_types
        )
        items_excluded = len(exclude_ids)

    items, reasoning = generate_recommendations(
        preferences=prefs,
        goals=goals,
        focus_concern=data.focus_concern,
        max_items=max_items,
        item_types=data.item_types,
        catalog=catalog,
        current_item_names=current_names,
        exclude_ids=exclude_ids,
    )

    return RecommendationResponse(
        items=[RecommendedItem(**item) for item in items],
        reasoning_summary=reasoning,
        goals_used=goals,
        slot_budget=max_items,
        items_excluded_current=items_excluded,
    )


@router.post("/recommendations/apply", response_model=ApplyRecommendationsResponse, status_code=201)
async def apply_recommendations(
    data: ApplyRecommendationsRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await apply_recommendations_to_user(
        session=session,
        user_id=current_user.id,
        items=data.items,
        protocol_name=data.protocol_name,
        started_at_value=data.started_at,
    )


@router.get("/interactions", response_model=InteractionCheckResponse)
async def check_user_interactions(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_supplements, user_medications, user_therapies, user_peptides = await _load_active_interaction_items(
        session,
        current_user.id,
        include_therapies=True,
    )

    item_dicts = build_item_dicts_for_checking(
        supplements=user_supplements,
        medications=user_medications,
        therapies=user_therapies,
        peptides=user_peptides,
    )

    interactions = check_interactions(item_dicts)
    return _interaction_response(interactions)


@router.post("/interactions/preview", response_model=InteractionCheckResponse)
async def preview_item_interactions(
    data: InteractionPreviewRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_supplements, user_medications, user_therapies, user_peptides = await _load_active_interaction_items(
        session,
        current_user.id,
        include_therapies=True,
    )
    preview_supplements, preview_medications, preview_therapies, preview_peptides = await _load_preview_catalog_items_or_404(
        session,
        data.items,
    )

    preview_names = {
        item.name
        for item in [*preview_supplements, *preview_medications, *preview_therapies, *preview_peptides]
    }

    item_dicts = build_item_dicts_for_checking(
        supplements=[*user_supplements, *preview_supplements],
        medications=[*user_medications, *preview_medications],
        therapies=[*user_therapies, *preview_therapies],
        peptides=[*user_peptides, *preview_peptides],
    )

    interactions = [
        interaction
        for interaction in check_interactions(item_dicts)
        if interaction.item_a in preview_names or interaction.item_b in preview_names
    ]
    return _interaction_response(interactions)


@router.get("/stack-score", response_model=StackScoreResponse)
async def get_stack_score(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Compute a 0-100 score rating the user's current active regimen."""
    prefs = await _get_or_none(session, current_user.id)

    # Load active items
    supplements_result = await session.execute(
        select(UserSupplement)
        .options(selectinload(UserSupplement.supplement))
        .where(UserSupplement.user_id == current_user.id, UserSupplement.is_active.is_(True))
    )
    user_supplements = list(supplements_result.scalars().all())

    medications_result = await session.execute(
        select(UserMedication)
        .options(selectinload(UserMedication.medication))
        .where(UserMedication.user_id == current_user.id, UserMedication.is_active.is_(True))
    )
    user_medications = list(medications_result.scalars().all())

    peptides_result = await session.execute(
        select(UserPeptide)
        .options(selectinload(UserPeptide.peptide))
        .where(UserPeptide.user_id == current_user.id, UserPeptide.is_active.is_(True))
    )
    user_peptides = list(peptides_result.scalars().all())

    item_dicts = build_item_dicts_for_checking(
        supplements=user_supplements,
        medications=user_medications,
        peptides=user_peptides,
    )

    interactions = check_interactions(item_dicts)

    result = compute_stack_score(
        item_dicts=item_dicts,
        interactions=interactions,
        preferences=prefs,
    )

    return StackScoreResponse(
        total_score=result.total_score,
        dimensions=[
            ScoreDimensionResponse(
                name=d.name, score=d.score, weight=d.weight, details=d.details,
            )
            for d in result.dimensions
        ],
        synergies_found=[
            SynergyPairResponse(
                item_a=s.item_a, item_b=s.item_b, benefit=s.benefit,
            )
            for s in result.synergies_found
        ],
        suggestions=result.suggestions,
        item_count=result.item_count,
    )


@router.post("/wizard", response_model=WizardResponse)
async def wizard_turn(
    data: WizardRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Process one turn of the guided wizard conversation.

    The client sends the user's message + full conversation history,
    and gets back the assistant's response. When is_complete=True,
    the response includes extracted preferences and recommendations
    ready to be applied.
    """
    catalog = await _load_catalog(session, ["supplement", "medication", "therapy", "peptide"])

    # Load user preferences to provide as context (age, sex, goals, etc.)
    prefs = await _get_or_none(session, current_user.id)
    user_profile = None
    if prefs is not None:
        user_profile = {
            "age": prefs.age,
            "biological_sex": prefs.biological_sex,
            "primary_goals": prefs.primary_goals,
            "focus_concerns": prefs.focus_concerns,
            "excluded_ingredients": prefs.excluded_ingredients,
            "max_supplements_per_day": prefs.max_supplements_per_day,
            "max_tablets_per_day": prefs.max_tablets_per_day,
        }

    conversation = [
        WizardTurn(role=t.role, content=t.content)
        for t in data.conversation
    ]

    result = run_wizard_turn(
        conversation=conversation,
        user_message=data.message,
        catalog=catalog,
        user_profile=user_profile,
    )

    return WizardResponse(
        assistant_message=result.assistant_message,
        conversation=[
            WizardTurnSchema(role=t.role, content=t.content)
            for t in result.conversation
        ],
        is_complete=result.is_complete,
        extracted_preferences=result.extracted_preferences,
        recommended_items=[
            WizardRecommendedItem(**item) for item in result.recommended_items
        ] if result.recommended_items else None,
        protocol_name=result.protocol_name,
        summary=result.summary,
    )
