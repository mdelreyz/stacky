from datetime import date

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.services.data_export import export_adherence_csv, export_journal_csv, export_stack_csv

router = APIRouter(prefix="/users/me/export", tags=["data-export"])


@router.get("/adherence")
async def export_adherence(
    start_date: date | None = None,
    end_date: date | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Export adherence history as CSV."""
    csv_content = await export_adherence_csv(session, current_user.id, start_date, end_date)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=adherence_export.csv",
        },
    )


@router.get("/stack")
async def export_stack(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Export current active stack as CSV."""
    csv_content = await export_stack_csv(session, current_user.id)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=stack_export.csv",
        },
    )


@router.get("/journal")
async def export_journal(
    start_date: date | None = None,
    end_date: date | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Export health journal entries as CSV."""
    csv_content = await export_journal_csv(session, current_user.id, start_date, end_date)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=journal_export.csv",
        },
    )
