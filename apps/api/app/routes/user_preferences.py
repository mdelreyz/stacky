import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_session
from app.models.medication import Medication
from app.models.peptide import Peptide
from app.models.protocol import Protocol, ProtocolItem
from app.models.supplement import Supplement
from app.models.therapy import Therapy
from app.models.user import User
from app.models.user_medication import UserMedication
from app.models.user_peptide import UserPeptide
from app.models.user_preferences import UserPreferences
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.schemas.user_preferences import (
    AppliedItem,
    ApplyRecommendationsRequest,
    ApplyRecommendationsResponse,
    InteractionCheckResponse,
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
from app.services.interaction_checker import (
    build_item_dicts_for_checking,
    check_interactions,
)
from app.services.guided_wizard import WizardTurn, run_wizard_turn
from app.services.stack_score import compute_stack_score
from app.services.recommendation_engine import (
    CatalogSnapshot,
    generate_recommendations,
    _supplement_to_dict,
    _medication_to_dict,
    _therapy_to_dict,
    _peptide_to_dict,
)
from app.services.supplement_visibility import get_visible_supplement

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


_DEFAULT_DOSAGES = {
    "supplement": (1.0, "capsule"),
    "medication": (1.0, "tablet"),
    "therapy": (20.0, "minutes"),
    "peptide": (0.1, "mg"),
}

_DEFAULT_WINDOWS = {
    "supplement": "morning_with_food",
    "medication": "evening",
    "therapy": "afternoon",
    "peptide": "morning_fasted",
}


@router.post("/recommendations/apply", response_model=ApplyRecommendationsResponse, status_code=201)
async def apply_recommendations(
    data: ApplyRecommendationsRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    today = date.today()
    started_at = date.fromisoformat(data.started_at) if data.started_at else today

    applied: list[AppliedItem] = []
    user_supplement_ids: list[uuid.UUID] = []
    user_medication_ids: list[uuid.UUID] = []
    user_therapy_ids: list[uuid.UUID] = []
    user_peptide_ids: list[uuid.UUID] = []

    for item in data.items:
        default_amount, default_unit = _DEFAULT_DOSAGES.get(item.item_type, (1.0, "unit"))
        dosage_amount = item.dosage_amount or default_amount
        dosage_unit = item.dosage_unit or default_unit
        take_window = item.take_window or _DEFAULT_WINDOWS.get(item.item_type, "morning_with_food")
        frequency = item.frequency or "daily"

        if item.item_type == "supplement":
            catalog_item = await get_visible_supplement(session, item.catalog_id, current_user.id)
            if catalog_item is None:
                raise HTTPException(status_code=400, detail=f"Supplement {item.catalog_id} not found")

            # Check for existing active entry
            dup = await session.execute(
                select(UserSupplement).where(
                    UserSupplement.user_id == current_user.id,
                    UserSupplement.supplement_id == item.catalog_id,
                    UserSupplement.is_active.is_(True),
                )
            )
            if dup.scalar_one_or_none() is not None:
                continue  # Skip already-active items silently

            user_item = UserSupplement(
                user_id=current_user.id,
                supplement_id=item.catalog_id,
                dosage_amount=dosage_amount,
                dosage_unit=dosage_unit,
                frequency=frequency,
                take_window=take_window,
                with_food="with_food" in take_window,
                started_at=started_at,
            )
            session.add(user_item)
            await session.flush()
            user_supplement_ids.append(user_item.id)
            applied.append(AppliedItem(
                user_item_id=str(user_item.id),
                item_type="supplement",
                catalog_id=str(item.catalog_id),
                name=catalog_item.name,
            ))

        elif item.item_type == "medication":
            existing = await session.execute(
                select(Medication).where(Medication.id == item.catalog_id)
            )
            catalog_item = existing.scalar_one_or_none()
            if catalog_item is None:
                raise HTTPException(status_code=400, detail=f"Medication {item.catalog_id} not found")

            dup = await session.execute(
                select(UserMedication).where(
                    UserMedication.user_id == current_user.id,
                    UserMedication.medication_id == item.catalog_id,
                    UserMedication.is_active.is_(True),
                )
            )
            if dup.scalar_one_or_none() is not None:
                continue

            user_item = UserMedication(
                user_id=current_user.id,
                medication_id=item.catalog_id,
                dosage_amount=dosage_amount,
                dosage_unit=dosage_unit,
                frequency=frequency,
                take_window=take_window,
                started_at=started_at,
            )
            session.add(user_item)
            await session.flush()
            user_medication_ids.append(user_item.id)
            applied.append(AppliedItem(
                user_item_id=str(user_item.id),
                item_type="medication",
                catalog_id=str(item.catalog_id),
                name=catalog_item.name,
            ))

        elif item.item_type == "therapy":
            existing = await session.execute(
                select(Therapy).where(Therapy.id == item.catalog_id)
            )
            catalog_item = existing.scalar_one_or_none()
            if catalog_item is None:
                raise HTTPException(status_code=400, detail=f"Therapy {item.catalog_id} not found")

            dup = await session.execute(
                select(UserTherapy).where(
                    UserTherapy.user_id == current_user.id,
                    UserTherapy.therapy_id == item.catalog_id,
                    UserTherapy.is_active.is_(True),
                )
            )
            if dup.scalar_one_or_none() is not None:
                continue

            user_item = UserTherapy(
                user_id=current_user.id,
                therapy_id=item.catalog_id,
                duration_minutes=int(dosage_amount),
                frequency=frequency,
                take_window=take_window,
                started_at=started_at,
            )
            session.add(user_item)
            await session.flush()
            user_therapy_ids.append(user_item.id)
            applied.append(AppliedItem(
                user_item_id=str(user_item.id),
                item_type="therapy",
                catalog_id=str(item.catalog_id),
                name=catalog_item.name,
            ))

        elif item.item_type == "peptide":
            existing = await session.execute(
                select(Peptide).where(Peptide.id == item.catalog_id)
            )
            catalog_item = existing.scalar_one_or_none()
            if catalog_item is None:
                raise HTTPException(status_code=400, detail=f"Peptide {item.catalog_id} not found")

            dup = await session.execute(
                select(UserPeptide).where(
                    UserPeptide.user_id == current_user.id,
                    UserPeptide.peptide_id == item.catalog_id,
                    UserPeptide.is_active.is_(True),
                )
            )
            if dup.scalar_one_or_none() is not None:
                continue

            user_item = UserPeptide(
                user_id=current_user.id,
                peptide_id=item.catalog_id,
                dosage_amount=dosage_amount,
                dosage_unit=dosage_unit,
                frequency=frequency,
                take_window=take_window,
                started_at=started_at,
            )
            session.add(user_item)
            await session.flush()
            user_peptide_ids.append(user_item.id)
            applied.append(AppliedItem(
                user_item_id=str(user_item.id),
                item_type="peptide",
                catalog_id=str(item.catalog_id),
                name=catalog_item.name,
            ))

    if not applied:
        raise HTTPException(status_code=400, detail="All recommended items are already in your active regimen")

    # Optionally create a protocol grouping all applied items
    protocol_id = None
    if data.protocol_name:
        protocol = Protocol(
            user_id=current_user.id,
            name=data.protocol_name,
        )
        session.add(protocol)
        await session.flush()
        protocol_id = str(protocol.id)

        sort_idx = 0
        for uid in user_supplement_ids:
            session.add(ProtocolItem(protocol_id=protocol.id, item_type="supplement", user_supplement_id=uid, sort_order=sort_idx))
            sort_idx += 1
        for uid in user_medication_ids:
            session.add(ProtocolItem(protocol_id=protocol.id, item_type="medication", user_medication_id=uid, sort_order=sort_idx))
            sort_idx += 1
        for uid in user_therapy_ids:
            session.add(ProtocolItem(protocol_id=protocol.id, item_type="therapy", user_therapy_id=uid, sort_order=sort_idx))
            sort_idx += 1
        for uid in user_peptide_ids:
            session.add(ProtocolItem(protocol_id=protocol.id, item_type="peptide", user_peptide_id=uid, sort_order=sort_idx))
            sort_idx += 1

    await session.commit()

    return ApplyRecommendationsResponse(
        applied=applied,
        protocol_id=protocol_id,
        protocol_name=data.protocol_name,
    )


@router.get("/interactions", response_model=InteractionCheckResponse)
async def check_user_interactions(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
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

    conversation = [
        WizardTurn(role=t.role, content=t.content)
        for t in data.conversation
    ]

    result = run_wizard_turn(
        conversation=conversation,
        user_message=data.message,
        catalog=catalog,
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
