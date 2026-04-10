import asyncio
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.medication import Medication
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.medication import MedicationOnboardRequest, MedicationOnboardResponse, MedicationResponse
from app.services.ai_onboarding import (
    get_ai_unavailable_reason,
    resolve_medication_ai_status,
    run_medication_ai_onboarding_job_sync,
    set_ai_status,
)
from app.services.pagination import paginate, paginated_response
from app.tasks.ai_onboarding import generate_medication_ai_profile

router = APIRouter(prefix="/medications", tags=["medications"])
logger = logging.getLogger(__name__)


async def _serialize_medication(medication: Medication) -> MedicationResponse:
    ai_status, ai_error = await resolve_medication_ai_status(medication)
    return MedicationResponse(
        id=medication.id,
        name=medication.name,
        category=medication.category,
        form=medication.form,
        description=medication.description,
        ai_profile=medication.ai_profile,
        ai_status=ai_status,
        ai_error=ai_error,
        ai_generated_at=medication.ai_generated_at,
        is_verified=medication.is_verified,
    )


def _dispatch_medication_ai_onboarding(medication_id: uuid.UUID, background_tasks: BackgroundTasks) -> None:
    try:
        generate_medication_ai_profile.delay(str(medication_id))
    except Exception:
        logger.warning("Celery dispatch failed for medication %s, using in-process fallback", medication_id, exc_info=True)
        background_tasks.add_task(run_medication_ai_onboarding_job_sync, str(medication_id))


@router.get("", response_model=PaginatedResponse[MedicationResponse])
async def list_medications(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    query = select(Medication).order_by(Medication.name)
    if search:
        query = query.where(Medication.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Medication.category == category)

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=list(await asyncio.gather(*(_serialize_medication(m) for m in rows))),
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Medication).where(Medication.id == medication_id))
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    return await _serialize_medication(medication)


@router.post("/onboard", response_model=MedicationOnboardResponse, status_code=201)
async def onboard_medication(
    data: MedicationOnboardRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    unavailable_reason = get_ai_unavailable_reason()

    result = await session.execute(select(Medication).where(func.lower(Medication.name) == data.name.lower()))
    existing = result.scalar_one_or_none()
    if existing:
        status, error = await resolve_medication_ai_status(existing)
        if not existing.ai_profile and status != "generating":
            if unavailable_reason:
                await set_ai_status(str(existing.id), "failed", unavailable_reason, kind="medication")
                status, error = "failed", unavailable_reason
            else:
                await set_ai_status(str(existing.id), "generating", kind="medication")
                _dispatch_medication_ai_onboarding(existing.id, background_tasks)
                status, error = "generating", None
        return MedicationOnboardResponse(
            id=existing.id,
            name=existing.name,
            status=status,
            ai_profile=existing.ai_profile,
            ai_error=error,
        )

    medication = Medication(
        name=data.name,
        category=data.category or "other",
        form=data.form,
    )
    session.add(medication)
    await session.commit()
    await session.refresh(medication)

    if unavailable_reason:
        await set_ai_status(str(medication.id), "failed", unavailable_reason, kind="medication")
        return MedicationOnboardResponse(
            id=medication.id,
            name=medication.name,
            status="failed",
            ai_profile=None,
            ai_error=unavailable_reason,
        )

    await set_ai_status(str(medication.id), "generating", kind="medication")
    _dispatch_medication_ai_onboarding(medication.id, background_tasks)

    return MedicationOnboardResponse(
        id=medication.id,
        name=medication.name,
        status="generating",
        ai_profile=None,
        ai_error=None,
    )
