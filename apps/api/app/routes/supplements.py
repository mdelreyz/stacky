import asyncio
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.supplement import Supplement
from app.models.user import User
from app.models.user_supplement import UserSupplement
from app.schemas.common import PaginatedResponse
from app.schemas.supplement import SupplementOnboardRequest, SupplementOnboardResponse, SupplementResponse
from app.services.ai_onboarding import (
    get_ai_unavailable_reason,
    resolve_ai_status,
    run_ai_onboarding_job_sync,
    set_ai_status,
)
from app.services.pagination import paginate, paginated_response
from app.services.supplement_visibility import get_visible_supplement, supplement_visibility_clause
from app.tasks.ai_onboarding import generate_ai_profile

router = APIRouter(prefix="/supplements", tags=["supplements"])
logger = logging.getLogger(__name__)


async def _serialize_supplement(supplement: Supplement) -> SupplementResponse:
    ai_status, ai_error = await resolve_ai_status(supplement)
    return SupplementResponse(
        id=supplement.id,
        name=supplement.name,
        category=supplement.category,
        source="catalog" if supplement.created_by_user_id is None else "user_created",
        form=supplement.form,
        description=supplement.description,
        goals=supplement.goals,
        mechanism_tags=supplement.mechanism_tags,
        ai_profile=supplement.ai_profile,
        ai_status=ai_status,
        ai_error=ai_error,
        ai_generated_at=supplement.ai_generated_at,
        is_verified=supplement.is_verified,
    )


async def _find_existing_supplement_match(
    session: AsyncSession,
    name: str,
    current_user_id: uuid.UUID,
) -> Supplement | None:
    normalized_name = name.lower()

    catalog_result = await session.execute(
        select(Supplement)
        .where(
            func.lower(Supplement.name) == normalized_name,
            Supplement.created_by_user_id.is_(None),
        )
        .limit(1)
    )
    catalog_match = catalog_result.scalar_one_or_none()
    if catalog_match is not None:
        return catalog_match

    custom_result = await session.execute(
        select(Supplement)
        .where(
            func.lower(Supplement.name) == normalized_name,
            Supplement.created_by_user_id == current_user_id,
        )
        .limit(1)
    )
    return custom_result.scalar_one_or_none()


def _dispatch_ai_onboarding(supplement_id: uuid.UUID, background_tasks: BackgroundTasks) -> None:
    try:
        generate_ai_profile.delay(str(supplement_id))
    except Exception:
        logger.warning("Celery dispatch failed for supplement %s, using in-process fallback", supplement_id, exc_info=True)
        background_tasks.add_task(run_ai_onboarding_job_sync, str(supplement_id))


@router.get("", response_model=PaginatedResponse[SupplementResponse])
async def list_supplements(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Supplement)
        .where(supplement_visibility_clause(current_user.id))
        .order_by(Supplement.name, Supplement.created_by_user_id.is_not(None))
    )
    if search:
        query = query.where(Supplement.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Supplement.category == category)

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=list(await asyncio.gather(*(_serialize_supplement(s) for s in rows))),
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{supplement_id}", response_model=SupplementResponse)
async def get_supplement(
    supplement_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    supplement = await get_visible_supplement(session, supplement_id, current_user.id)
    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")
    return await _serialize_supplement(supplement)


@router.post("/onboard", response_model=SupplementOnboardResponse, status_code=201)
async def onboard_supplement(
    data: SupplementOnboardRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    unavailable_reason = get_ai_unavailable_reason()

    existing = await _find_existing_supplement_match(session, data.name, current_user.id)
    if existing:
        status, error = await resolve_ai_status(existing)
        if not existing.ai_profile and status != "generating":
            if unavailable_reason:
                await set_ai_status(str(existing.id), "failed", unavailable_reason)
                status, error = "failed", unavailable_reason
            else:
                await set_ai_status(str(existing.id), "generating")
                _dispatch_ai_onboarding(existing.id, background_tasks)
                status, error = "generating", None
        return SupplementOnboardResponse(
            id=existing.id,
            name=existing.name,
            status=status,
            ai_profile=existing.ai_profile,
            ai_error=error,
        )

    # Create new supplement (AI profile will be generated by worker)
    supplement = Supplement(
        created_by_user_id=current_user.id,
        name=data.name,
        category=data.category or "other",
        form=data.form,
    )
    session.add(supplement)
    await session.commit()
    await session.refresh(supplement)

    if unavailable_reason:
        await set_ai_status(str(supplement.id), "failed", unavailable_reason)
        return SupplementOnboardResponse(
            id=supplement.id,
            name=supplement.name,
            status="failed",
            ai_profile=None,
            ai_error=unavailable_reason,
        )

    await set_ai_status(str(supplement.id), "generating")
    _dispatch_ai_onboarding(supplement.id, background_tasks)

    return SupplementOnboardResponse(
        id=supplement.id,
        name=supplement.name,
        status="generating",
        ai_profile=None,
        ai_error=None,
    )


@router.delete("/{supplement_id}", status_code=204)
async def delete_supplement(
    supplement_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(Supplement).where(
            Supplement.id == supplement_id,
            Supplement.created_by_user_id == current_user.id,
        )
    )
    supplement = result.scalar_one_or_none()
    if supplement is None:
        raise HTTPException(status_code=404, detail="Supplement not found or not owned by you")

    reference = await session.execute(
        select(UserSupplement.id).where(UserSupplement.supplement_id == supplement_id).limit(1)
    )
    if reference.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409,
            detail="Remove this supplement from your protocol before deleting it.",
        )

    await session.delete(supplement)
    await session.commit()
