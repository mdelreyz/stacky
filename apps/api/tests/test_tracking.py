import asyncio
from datetime import date, datetime, timezone

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.supplement import Supplement, SupplementCategory
from app.models.user_supplement import TakeWindow, UserSupplement


def signup(client) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Track",
            "last_name": "Overview",
            "email": "tracking@example.com",
            "password": "Password123",
        },
    )
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def create_supplement(name: str):
    async def _create():
        async with async_session_factory() as session:
            supplement = Supplement(name=name, category=SupplementCategory.other)
            session.add(supplement)
            await session.commit()
            await session.refresh(supplement)
            return supplement.id

    return asyncio.run(_create())


def create_user_supplement(user_id: str, supplement_id):
    async def _create():
        async with async_session_factory() as session:
            user_supplement = UserSupplement(
                user_id=user_id,
                supplement_id=supplement_id,
                dosage_amount=2,
                dosage_unit="capsules",
                frequency="daily",
                take_window=TakeWindow.morning_with_food,
                started_at=date(2026, 4, 1),
                with_food=True,
            )
            session.add(user_supplement)
            await session.commit()
            await session.refresh(user_supplement)
            return user_supplement.id

    return asyncio.run(_create())


def create_log(user_id: str, item_id, *, scheduled_at: datetime, taken_at: datetime | None = None, skipped: bool = False):
    async def _create():
        async with async_session_factory() as session:
            session.add(
                AdherenceLog(
                    user_id=user_id,
                    item_type="supplement",
                    item_id=item_id,
                    scheduled_at=scheduled_at,
                    taken_at=taken_at,
                    skipped=skipped,
                    skip_reason="Travel day" if skipped else None,
                )
            )
            await session.commit()

    asyncio.run(_create())


def test_tracking_overview_summarizes_completion_and_recent_events(client):
    headers, user_id = signup(client)
    magnesium_id = create_supplement("Magnesium Glycinate")
    user_supplement_id = create_user_supplement(user_id, magnesium_id)

    create_log(
        user_id,
        user_supplement_id,
        scheduled_at=datetime(2026, 4, 6, 8, 0, tzinfo=timezone.utc),
        taken_at=datetime(2026, 4, 6, 8, 5, tzinfo=timezone.utc),
    )
    create_log(
        user_id,
        user_supplement_id,
        scheduled_at=datetime(2026, 4, 7, 8, 0, tzinfo=timezone.utc),
        skipped=True,
    )
    create_log(
        user_id,
        user_supplement_id,
        scheduled_at=datetime(2026, 4, 8, 8, 0, tzinfo=timezone.utc),
        taken_at=datetime(2026, 4, 8, 8, 6, tzinfo=timezone.utc),
    )

    response = client.get("/api/v1/users/me/tracking/overview?days=3&end_date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["scheduled_count"] == 3
    assert body["taken_count"] == 2
    assert body["skipped_count"] == 1
    assert body["pending_count"] == 0
    assert body["completion_rate"] == 0.667
    assert body["current_streak_days"] == 1
    assert body["item_stats"][0]["item_name"] == "Magnesium Glycinate"
    assert body["item_stats"][0]["completion_rate"] == 0.667
    assert body["recent_events"][0]["status"] == "taken"
    assert body["recent_events"][1]["status"] == "skipped"


def test_tracking_overview_counts_pending_scheduled_items(client):
    headers, user_id = signup(client)
    magnesium_id = create_supplement("Magnesium")
    create_user_supplement(user_id, magnesium_id)

    response = client.get("/api/v1/users/me/tracking/overview?days=3&end_date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["scheduled_count"] == 3
    assert body["taken_count"] == 0
    assert body["pending_count"] == 3
    assert body["suggestions"][0]["item_type"] in {"overall", "supplement"}
