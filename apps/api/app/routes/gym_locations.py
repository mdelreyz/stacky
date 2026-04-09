import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.gym_location import GymLocation
from app.models.user import User
from app.models.workout_routine import WorkoutRoutine
from app.schemas.exercise import (
    GymLocationCreate,
    GymLocationMatchRequest,
    GymLocationMatchResponse,
    GymLocationResponse,
    GymLocationUpdate,
    WorkoutRoutineResponse,
)
from app.services.gym_geofence import find_matching_gym

router = APIRouter(prefix="/users/me/gym-locations", tags=["gym-locations"])


@router.get("", response_model=list[GymLocationResponse])
async def list_gym_locations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(GymLocation)
        .where(GymLocation.user_id == current_user.id, GymLocation.is_active.is_(True))
        .order_by(GymLocation.name)
    )
    return [GymLocationResponse.model_validate(g) for g in result.scalars().all()]


@router.post("", response_model=GymLocationResponse, status_code=201)
async def create_gym_location(
    body: GymLocationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    loc = GymLocation(
        user_id=current_user.id,
        name=body.name,
        latitude=body.latitude,
        longitude=body.longitude,
        radius_meters=body.radius_meters,
        default_routine_id=body.default_routine_id,
    )
    session.add(loc)
    await session.commit()
    await session.refresh(loc)
    return GymLocationResponse.model_validate(loc)


@router.patch("/{location_id}", response_model=GymLocationResponse)
async def update_gym_location(
    location_id: uuid.UUID,
    body: GymLocationUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(GymLocation).where(
            GymLocation.id == location_id, GymLocation.user_id == current_user.id
        )
    )
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Gym location not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    await session.commit()
    await session.refresh(loc)
    return GymLocationResponse.model_validate(loc)


@router.delete("/{location_id}", status_code=204)
async def delete_gym_location(
    location_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(GymLocation).where(
            GymLocation.id == location_id, GymLocation.user_id == current_user.id
        )
    )
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Gym location not found")
    await session.delete(loc)
    await session.commit()


@router.post("/match", response_model=GymLocationMatchResponse)
async def match_gym_location(
    body: GymLocationMatchRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Given lat/lng, find matching gym and return its default routine."""
    gym = await find_matching_gym(session, current_user.id, body.latitude, body.longitude)
    if not gym:
        return GymLocationMatchResponse(matched=False)

    routine_response = None
    if gym.default_routine_id:
        result = await session.execute(
            select(WorkoutRoutine).where(WorkoutRoutine.id == gym.default_routine_id)
        )
        routine = result.scalar_one_or_none()
        if routine:
            routine_response = WorkoutRoutineResponse.model_validate(routine)

    return GymLocationMatchResponse(
        matched=True,
        gym_location=GymLocationResponse.model_validate(gym),
        default_routine=routine_response,
    )
