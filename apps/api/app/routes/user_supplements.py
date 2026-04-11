import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.models.user_supplement import UserSupplement
from app.schemas.common import PaginatedResponse
from app.schemas.supplement import (
    SupplementRefillItemResponse,
    SupplementRefillRequestResponse,
    UserSupplementCreate,
    UserSupplementResponse,
    UserSupplementUpdate,
)
from app.services.supplement_visibility import get_visible_supplement
from app.services.user_item_crud import (
    create_user_owned_item,
    deactivate_user_owned_item,
    ensure_no_active_duplicate,
    get_user_owned_item_or_404,
    list_user_owned_items,
    update_user_owned_item,
)
from app.services.user_supplement_serialization import serialize_user_supplement

router = APIRouter(prefix="/users/me/supplements", tags=["user-supplements"])


def _supplement_refill_request_text(items: list[UserSupplement]) -> str:
    if not items:
        return "No active supplements are currently marked as out of stock."

    lines = [
        "Hello Doctor,",
        "",
        "I have run out of the following supplements and would like renewed prescriptions or order guidance for them:",
        "",
    ]
    for item in items:
        regimen = f"{float(item.dosage_amount):g} {item.dosage_unit} · {item.frequency.value.replace('_', ' ')} · {item.take_window.value.replace('_', ' ')}"
        lines.append(f"- {item.supplement.name}: {regimen}")
        if item.notes:
            lines.append(f"  Notes: {item.notes}")

    lines.extend(
        [
            "",
            "Please let me know if you need any additional context or updates to this regimen.",
            "",
            "Thank you.",
        ]
    )
    return "\n".join(lines)


@router.get("", response_model=PaginatedResponse[UserSupplementResponse])
async def list_user_supplements(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await list_user_owned_items(
        session=session,
        model=UserSupplement,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        active_only=active_only,
        serializer=serialize_user_supplement,
    )


@router.get("/refill-request", response_model=SupplementRefillRequestResponse)
async def get_supplement_refill_request(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserSupplement).where(
            UserSupplement.user_id == current_user.id,
            UserSupplement.is_active.is_(True),
            UserSupplement.is_out_of_stock.is_(True),
        )
    )
    user_supplements = list(result.scalars().all())
    user_supplements.sort(key=lambda item: item.created_at)

    return SupplementRefillRequestResponse(
        items=[
            SupplementRefillItemResponse(
                user_supplement_id=item.id,
                supplement_name=item.supplement.name,
                dosage_amount=float(item.dosage_amount),
                dosage_unit=item.dosage_unit,
                frequency=item.frequency,
                take_window=item.take_window,
                notes=item.notes,
            )
            for item in user_supplements
        ],
        text=_supplement_refill_request_text(user_supplements),
    )


@router.get("/{user_supplement_id}", response_model=UserSupplementResponse)
async def get_user_supplement(
    user_supplement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_supplement = await get_user_owned_item_or_404(
        session=session,
        model=UserSupplement,
        item_id=user_supplement_id,
        user_id=current_user.id,
        not_found_detail="User supplement not found",
    )
    return await serialize_user_supplement(user_supplement)


@router.post("", response_model=UserSupplementResponse, status_code=201)
async def add_user_supplement(
    data: UserSupplementCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    supplement = await get_visible_supplement(session, data.supplement_id, current_user.id)
    if supplement is None:
        raise HTTPException(status_code=404, detail="Supplement not found")

    await ensure_no_active_duplicate(
        session=session,
        model=UserSupplement,
        user_id=current_user.id,
        foreign_key_field="supplement_id",
        foreign_key_id=data.supplement_id,
        conflict_detail="Supplement already active in your protocol",
    )
    return await create_user_owned_item(
        session=session,
        model=UserSupplement,
        item_kwargs={
            "user_id": current_user.id,
            "supplement_id": data.supplement_id,
            "dosage_amount": data.dosage_amount,
            "dosage_unit": data.dosage_unit,
            "frequency": data.frequency,
            "take_window": data.take_window,
            "with_food": data.with_food,
            "is_out_of_stock": data.is_out_of_stock,
            "notes": data.notes,
            "started_at": data.started_at,
        },
        serializer=serialize_user_supplement,
    )


@router.patch("/{user_supplement_id}", response_model=UserSupplementResponse)
async def update_user_supplement(
    user_supplement_id: uuid.UUID,
    data: UserSupplementUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_supplement = await get_user_owned_item_or_404(
        session=session,
        model=UserSupplement,
        item_id=user_supplement_id,
        user_id=current_user.id,
        not_found_detail="User supplement not found",
    )
    return await update_user_owned_item(
        session=session,
        item=user_supplement,
        update_data=data.model_dump(exclude_unset=True),
        serializer=serialize_user_supplement,
    )


@router.delete("/{user_supplement_id}", status_code=204)
async def remove_user_supplement(
    user_supplement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_supplement = await get_user_owned_item_or_404(
        session=session,
        model=UserSupplement,
        item_id=user_supplement_id,
        user_id=current_user.id,
        not_found_detail="User supplement not found",
    )
    await deactivate_user_owned_item(
        session=session,
        item=user_supplement,
        user_timezone=current_user.timezone,
    )
