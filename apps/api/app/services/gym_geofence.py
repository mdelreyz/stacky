"""GPS geofence matching for gym locations — haversine distance."""

import math
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gym_location import GymLocation


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in meters between two GPS coordinates."""
    R = 6_371_000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def find_matching_gym(
    session: AsyncSession,
    user_id: uuid.UUID,
    latitude: float,
    longitude: float,
) -> GymLocation | None:
    """Find the closest active gym location within its radius, or None."""
    result = await session.execute(
        select(GymLocation).where(
            GymLocation.user_id == user_id,
            GymLocation.is_active.is_(True),
        )
    )
    locations = result.scalars().all()

    best: GymLocation | None = None
    best_dist = float("inf")

    for loc in locations:
        dist = haversine_meters(latitude, longitude, loc.latitude, loc.longitude)
        if dist <= loc.radius_meters and dist < best_dist:
            best = loc
            best_dist = dist

    return best
