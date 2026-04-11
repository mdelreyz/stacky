"""Goal progress route."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.goal_progress import GoalProgressResponse
from app.services.goal_progress import compute_goal_progress

router = APIRouter(prefix="/users/me/goal-progress", tags=["goal-progress"])


@router.get("", response_model=GoalProgressResponse)
async def get_goal_progress(
    days: int = Query(14, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await compute_goal_progress(session, current_user.id, days)
    return GoalProgressResponse(**result)
