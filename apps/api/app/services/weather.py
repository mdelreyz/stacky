import logging
from typing import TypedDict

import httpx

from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


class UvConditions(TypedDict):
    uv_index: float
    is_day: bool


async def fetch_uv_conditions(latitude: float, longitude: float) -> UvConditions | None:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "uv_index,is_day",
        "forecast_days": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=settings.weather_request_timeout_seconds) as client:
            response = await client.get(settings.weather_api_base_url, params=params)
            response.raise_for_status()
        payload = response.json()
    except Exception:
        logger.debug("Weather API request failed", exc_info=True)
        return None

    current = payload.get("current")
    if not isinstance(current, dict):
        return None

    uv_index = current.get("uv_index")
    is_day = current.get("is_day")
    if not isinstance(uv_index, (int, float)) or not isinstance(is_day, (int, float, bool)):
        return None

    return {
        "uv_index": max(float(uv_index), 0.0),
        "is_day": bool(is_day),
    }


def sunscreen_guidance(uv_index: float, is_day: bool, location_name: str | None) -> dict:
    place = location_name or "saved location"

    if not is_day:
        return {
            "location_name": place,
            "uv_index": round(uv_index, 1),
            "level": "low",
            "is_day": False,
            "recommended_spf": None,
            "reapply_hours": None,
            "headline": "No daytime UV exposure right now",
            "recommendation": "It appears to be outside daylight hours, so no immediate sunscreen reminder is needed.",
        }

    if uv_index < 3:
        return {
            "location_name": place,
            "uv_index": round(uv_index, 1),
            "level": "low",
            "is_day": True,
            "recommended_spf": 30,
            "reapply_hours": None,
            "headline": "Low UV exposure",
            "recommendation": "SPF is optional for brief exposure, but daily sunscreen is still sensible if you use resurfacing or sensitizing skin treatments.",
        }

    if uv_index < 6:
        return {
            "location_name": place,
            "uv_index": round(uv_index, 1),
            "level": "moderate",
            "is_day": True,
            "recommended_spf": 30,
            "reapply_hours": 2,
            "headline": "Moderate UV exposure",
            "recommendation": "Apply a broad-spectrum SPF 30+ before going out, especially for midday exposure.",
        }

    if uv_index < 8:
        return {
            "location_name": place,
            "uv_index": round(uv_index, 1),
            "level": "high",
            "is_day": True,
            "recommended_spf": 50,
            "reapply_hours": 2,
            "headline": "High UV exposure",
            "recommendation": "Use SPF 50+, reapply every 2 hours, and add shade, hat, or protective clothing if you will be outside.",
        }

    return {
        "location_name": place,
        "uv_index": round(uv_index, 1),
        "level": "very_high",
        "is_day": True,
        "recommended_spf": 50,
        "reapply_hours": 2,
        "headline": "Very high UV exposure",
        "recommendation": "Use SPF 50+, reapply every 2 hours, avoid peak midday exposure when possible, and add physical sun protection.",
    }


async def build_skincare_guidance(user: User) -> dict | None:
    if user.latitude is None or user.longitude is None:
        return None

    conditions = await fetch_uv_conditions(user.latitude, user.longitude)
    if conditions is None:
        return None

    return sunscreen_guidance(conditions["uv_index"], conditions["is_day"], user.location_name)
