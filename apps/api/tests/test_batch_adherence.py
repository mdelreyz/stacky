import asyncio
from datetime import date

from sqlalchemy import func, select

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.medication import Medication, MedicationCategory
from app.models.supplement import Supplement, SupplementCategory
from app.models.therapy import Therapy, TherapyCategory
from app.models.enums import Frequency, TakeWindow
from app.models.user_medication import UserMedication
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy


def signup(client) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Batch",
            "last_name": "Adherence",
            "email": "batch@example.com",
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


def create_medication(name: str):
    async def _create():
        async with async_session_factory() as session:
            medication = Medication(name=name, category=MedicationCategory.other, form="tablet")
            session.add(medication)
            await session.commit()
            await session.refresh(medication)
            return medication.id

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


def create_user_supplement(user_id: str, supplement_id, *, take_window=TakeWindow.morning_with_food):
    async def _create():
        async with async_session_factory() as session:
            user_supplement = UserSupplement(
                user_id=user_id,
                supplement_id=supplement_id,
                dosage_amount=2,
                dosage_unit="capsules",
                frequency=Frequency.daily,
                take_window=take_window,
                started_at=date(2026, 4, 1),
                with_food=True,
            )
            session.add(user_supplement)
            await session.commit()
            await session.refresh(user_supplement)
            return user_supplement.id

    return asyncio.run(_create())


def create_user_medication(user_id: str, medication_id, *, take_window=TakeWindow.morning_with_food):
    async def _create():
        async with async_session_factory() as session:
            user_medication = UserMedication(
                user_id=user_id,
                medication_id=medication_id,
                dosage_amount=1,
                dosage_unit="tablet",
                frequency=Frequency.daily,
                take_window=take_window,
                started_at=date(2026, 4, 1),
            )
            session.add(user_medication)
            await session.commit()
            await session.refresh(user_medication)
            return user_medication.id

    return asyncio.run(_create())


def create_user_therapy(user_id: str, therapy_id, *, take_window=TakeWindow.morning_with_food):
    async def _create():
        async with async_session_factory() as session:
            user_therapy = UserTherapy(
                user_id=user_id,
                therapy_id=therapy_id,
                duration_minutes=15,
                frequency=Frequency.daily,
                take_window=take_window,
                settings={"intensity": "medium"},
                started_at=date(2026, 4, 1),
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


def fetch_user_therapy(user_therapy_id):
    async def _fetch():
        async with async_session_factory() as session:
            result = await session.execute(select(UserTherapy).where(UserTherapy.id == user_therapy_id))
            return result.scalar_one()

    return asyncio.run(_fetch())


def test_batch_take_marks_all_protocol_items(client):
    headers, user_id = signup(client)
    mag_id = create_supplement("Magnesium")
    d3_id = create_supplement("Vitamin D3")
    user_mag_id = create_user_supplement(user_id, mag_id)
    user_d3_id = create_user_supplement(user_id, d3_id)

    protocol_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Morning Stack",
            "user_supplement_ids": [str(user_mag_id), str(user_d3_id)],
        },
        headers=headers,
    )
    assert protocol_response.status_code == 201
    protocol_id = protocol_response.json()["id"]

    response = client.post(
        f"/api/v1/users/me/adherence/protocols/{protocol_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["protocol_name"] == "Morning Stack"
    assert body["status"] == "taken"
    assert len(body["items_marked"]) == 2
    assert body["items_not_due"] == []
    assert {item["item_name"] for item in body["items_marked"]} == {"Magnesium", "Vitamin D3"}
    assert all(item["status"] == "taken" for item in body["items_marked"])
    assert all(item["taken_at"] is not None for item in body["items_marked"])
    assert adherence_log_count() == 2

    plan_response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)
    assert plan_response.status_code == 200
    windows = {w["window"]: w for w in plan_response.json()["windows"]}
    statuses = [item["adherence_status"] for item in windows["morning_with_food"]["items"]]
    assert statuses == ["taken", "taken"]


def test_batch_skip_marks_all_with_reason(client):
    headers, user_id = signup(client)
    mag_id = create_supplement("Magnesium")
    d3_id = create_supplement("Vitamin D3")
    user_mag_id = create_user_supplement(user_id, mag_id)
    user_d3_id = create_user_supplement(user_id, d3_id)

    protocol_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Morning Stack",
            "user_supplement_ids": [str(user_mag_id), str(user_d3_id)],
        },
        headers=headers,
    )
    protocol_id = protocol_response.json()["id"]

    response = client.post(
        f"/api/v1/users/me/adherence/protocols/{protocol_id}",
        json={"status": "skipped", "date": "2026-04-08", "skip_reason": "Travel day"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert all(item["status"] == "skipped" for item in body["items_marked"])
    assert all(item["skip_reason"] == "Travel day" for item in body["items_marked"])
    assert all(item["taken_at"] is None for item in body["items_marked"])


def test_batch_mixed_protocol_with_therapy_updates_last_completed(client):
    headers, user_id = signup(client)
    mag_id = create_supplement("Magnesium")
    sauna_id = create_therapy("Red Light")
    user_mag_id = create_user_supplement(user_id, mag_id)
    user_sauna_id = create_user_therapy(user_id, sauna_id)

    protocol_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Recovery Stack",
            "user_supplement_ids": [str(user_mag_id)],
            "user_therapy_ids": [str(user_sauna_id)],
        },
        headers=headers,
    )
    protocol_id = protocol_response.json()["id"]

    response = client.post(
        f"/api/v1/users/me/adherence/protocols/{protocol_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items_marked"]) == 2
    types = {item["item_type"] for item in body["items_marked"]}
    assert types == {"supplement", "therapy"}

    refreshed = fetch_user_therapy(user_sauna_id)
    assert "last_completed_at" in refreshed.settings


def test_batch_skips_items_not_due_and_reports_them(client):
    headers, user_id = signup(client)
    daily_id = create_supplement("Daily Mag")
    eod_id = create_supplement("Every Other Day Zinc")

    user_daily_id = create_user_supplement(user_id, daily_id)

    async def _create_eod():
        async with async_session_factory() as session:
            us = UserSupplement(
                user_id=user_id,
                supplement_id=eod_id,
                dosage_amount=1,
                dosage_unit="capsule",
                frequency=Frequency.every_other_day,
                take_window=TakeWindow.morning_with_food,
                started_at=date(2026, 4, 7),
                with_food=True,
            )
            session.add(us)
            await session.commit()
            await session.refresh(us)
            return us.id

    user_eod_id = asyncio.run(_create_eod())

    protocol_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Morning Stack",
            "user_supplement_ids": [str(user_daily_id), str(user_eod_id)],
        },
        headers=headers,
    )
    protocol_id = protocol_response.json()["id"]

    # 2026-04-08 is 1 day after started_at=2026-04-07 for EOD item → not due (odd day)
    response = client.post(
        f"/api/v1/users/me/adherence/protocols/{protocol_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items_marked"]) == 1
    assert body["items_marked"][0]["item_name"] == "Daily Mag"
    assert body["items_not_due"] == ["Every Other Day Zinc"]
    assert adherence_log_count() == 1


def test_batch_returns_400_when_no_items_due(client):
    headers, user_id = signup(client)
    mag_id = create_supplement("Magnesium")
    user_mag_id = create_user_supplement(user_id, mag_id)

    protocol_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Paused Stack",
            "schedule": {"type": "manual", "manual_is_active": False},
            "user_supplement_ids": [str(user_mag_id)],
        },
        headers=headers,
    )
    protocol_id = protocol_response.json()["id"]

    response = client.post(
        f"/api/v1/users/me/adherence/protocols/{protocol_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "No items in this protocol are scheduled for that date"


def test_batch_with_medication_in_protocol(client):
    headers, user_id = signup(client)
    mag_id = create_supplement("Magnesium")
    fin_id = create_medication("Finasteride")
    user_mag_id = create_user_supplement(user_id, mag_id)
    user_fin_id = create_user_medication(user_id, fin_id)

    protocol_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Hair Stack",
            "user_supplement_ids": [str(user_mag_id)],
            "user_medication_ids": [str(user_fin_id)],
        },
        headers=headers,
    )
    protocol_id = protocol_response.json()["id"]

    response = client.post(
        f"/api/v1/users/me/adherence/protocols/{protocol_id}",
        json={"status": "taken", "date": "2026-04-08"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items_marked"]) == 2
    types = {item["item_type"] for item in body["items_marked"]}
    assert types == {"supplement", "medication"}
    assert adherence_log_count() == 2


def test_batch_idempotent_on_second_call(client):
    headers, user_id = signup(client)
    mag_id = create_supplement("Magnesium")
    user_mag_id = create_user_supplement(user_id, mag_id)

    protocol_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Stack",
            "user_supplement_ids": [str(user_mag_id)],
        },
        headers=headers,
    )
    protocol_id = protocol_response.json()["id"]

    for _ in range(2):
        response = client.post(
            f"/api/v1/users/me/adherence/protocols/{protocol_id}",
            json={"status": "taken", "date": "2026-04-08"},
            headers=headers,
        )
        assert response.status_code == 200

    assert adherence_log_count() == 1
