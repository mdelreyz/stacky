import asyncio
from datetime import date

from sqlalchemy import func, select

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.supplement import Supplement, SupplementCategory
from app.models.therapy import Therapy, TherapyCategory
from app.models.user_supplement import Frequency, TakeWindow, UserSupplement
from app.models.user_therapy import UserTherapy


def signup(client) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Track",
            "last_name": "Adherence",
            "email": "adherence@example.com",
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


def create_therapy(name: str):
    async def _create():
        async with async_session_factory() as session:
            therapy = Therapy(name=name, category=TherapyCategory.other)
            session.add(therapy)
            await session.commit()
            await session.refresh(therapy)
            return therapy.id

    return asyncio.run(_create())


def create_user_supplement(
    user_id: str,
    supplement_id,
    *,
    frequency: Frequency = Frequency.daily,
    take_window: TakeWindow = TakeWindow.morning_with_food,
    started_at: date = date(2026, 4, 1),
):
    async def _create():
        async with async_session_factory() as session:
            user_supplement = UserSupplement(
                user_id=user_id,
                supplement_id=supplement_id,
                dosage_amount=2,
                dosage_unit="capsules",
                frequency=frequency,
                take_window=take_window,
                started_at=started_at,
                with_food=(take_window == TakeWindow.morning_with_food),
            )
            session.add(user_supplement)
            await session.commit()
            await session.refresh(user_supplement)
            return user_supplement.id

    return asyncio.run(_create())


def create_user_therapy(
    user_id: str,
    therapy_id,
    *,
    frequency: Frequency = Frequency.daily,
    take_window: TakeWindow = TakeWindow.afternoon,
    started_at: date = date(2026, 4, 1),
):
    async def _create():
        async with async_session_factory() as session:
            user_therapy = UserTherapy(
                user_id=user_id,
                therapy_id=therapy_id,
                duration_minutes=20,
                frequency=frequency,
                take_window=take_window,
                settings={"session_details": "Full body"},
                started_at=started_at,
            )
            session.add(user_therapy)
            await session.commit()
            await session.refresh(user_therapy)
            return user_therapy.id

    return asyncio.run(_create())


def adherence_log_count():
    async def _count():
        async with async_session_factory() as session:
            result = await session.execute(select(func.count()).select_from(AdherenceLog))
            return result.scalar_one()

    return asyncio.run(_count())


def test_mark_supplement_taken_then_skipped_updates_existing_log(client):
    headers, user_id = signup(client)
    supplement_id = create_supplement("Vitamin C")
    user_supplement_id = create_user_supplement(user_id, supplement_id)

    taken_response = client.post(
        f"/api/v1/users/me/adherence/supplements/{user_supplement_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )
    assert taken_response.status_code == 200
    assert taken_response.json()["status"] == "taken"
    assert adherence_log_count() == 1

    skipped_response = client.post(
        f"/api/v1/users/me/adherence/supplements/{user_supplement_id}",
        json={"status": "skipped", "date": "2026-04-08", "skip_reason": "Forgot it at home"},
        headers=headers,
    )
    assert skipped_response.status_code == 200
    assert skipped_response.json()["status"] == "skipped"
    assert skipped_response.json()["skip_reason"] == "Forgot it at home"
    assert adherence_log_count() == 1

    plan_response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)
    assert plan_response.status_code == 200
    windows = {window["window"]: window for window in plan_response.json()["windows"]}
    assert windows["morning_with_food"]["items"][0]["adherence_status"] == "skipped"


def test_marking_not_due_supplement_returns_400(client):
    headers, user_id = signup(client)
    supplement_id = create_supplement("Berberine")
    user_supplement_id = create_user_supplement(
        user_id,
        supplement_id,
        frequency=Frequency.every_other_day,
        started_at=date(2026, 4, 7),
    )

    response = client.post(
        f"/api/v1/users/me/adherence/supplements/{user_supplement_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "This supplement is not scheduled for that date"


def test_mark_therapy_taken_updates_daily_plan(client):
    headers, user_id = signup(client)
    therapy_id = create_therapy("Infrared Panel")
    user_therapy_id = create_user_therapy(user_id, therapy_id)

    response = client.post(
        f"/api/v1/users/me/adherence/therapies/{user_therapy_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "taken"
    assert adherence_log_count() == 1

    plan_response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)
    assert plan_response.status_code == 200
    windows = {window["window"]: window for window in plan_response.json()["windows"]}
    assert windows["afternoon"]["items"][0]["type"] == "therapy"
    assert windows["afternoon"]["items"][0]["adherence_status"] == "taken"
