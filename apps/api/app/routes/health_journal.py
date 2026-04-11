"""Health journal API routes."""

import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.health_journal import (
    HealthJournalEntryCreate,
    HealthJournalEntryResponse,
    HealthJournalEntryUpdate,
    HealthJournalSummaryResponse,
)
from app.services.health_journal import (
    compute_journal_summary,
    delete_journal_entry,
    get_journal_entry,
    get_journal_entry_by_date,
    list_journal_entries,
    update_journal_entry,
    upsert_journal_entry,
)

router = APIRouter(prefix="/users/me/journal", tags=["health-journal"])


@router.get("", response_model=list[HealthJournalEntryResponse])
async def list_entries(
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    entries, _ = await list_journal_entries(
        session, current_user.id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return entries


@router.get("/summary", response_model=HealthJournalSummaryResponse)
async def get_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    summary = await compute_journal_summary(session, current_user.id, start_date, end_date)
    return HealthJournalSummaryResponse(**summary)


@router.get("/date/{entry_date}", response_model=HealthJournalEntryResponse)
async def get_entry_by_date(
    entry_date: date,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    entry = await get_journal_entry_by_date(session, current_user.id, entry_date)
    if not entry:
        raise HTTPException(status_code=404, detail="No journal entry for this date")
    return entry


@router.get("/{entry_id}", response_model=HealthJournalEntryResponse)
async def get_entry(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    entry = await get_journal_entry(session, current_user.id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.post("", response_model=HealthJournalEntryResponse, status_code=201)
async def create_entry(
    data: HealthJournalEntryCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    entry_data = data.model_dump(exclude={"entry_date"}, exclude_unset=True)
    entry = await upsert_journal_entry(
        session, current_user.id, data.entry_date, entry_data
    )
    await session.commit()
    return entry


@router.patch("/{entry_id}", response_model=HealthJournalEntryResponse)
async def patch_entry(
    entry_id: uuid.UUID,
    data: HealthJournalEntryUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    entry = await get_journal_entry(session, current_user.id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    update_data = data.model_dump(exclude_unset=True)
    entry = await update_journal_entry(session, entry, update_data)
    await session.commit()
    return entry


@router.delete("/{entry_id}", status_code=204)
async def remove_entry(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    entry = await get_journal_entry(session, current_user.id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    await delete_journal_entry(session, entry)
    await session.commit()
