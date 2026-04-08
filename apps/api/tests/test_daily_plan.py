from datetime import date, datetime, timezone

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
            "first_name": "Daily",
            "last_name": "Planner",
            "email": "daily@example.com",
            "password": "Password123",
        },
    )
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def create_supplement(name: str, ai_profile=None):
    async def _create():
        async with async_session_factory() as session:
            supplement = Supplement(
                name=name,
                category=SupplementCategory.other,
                ai_profile=ai_profile,
            )
            session.add(supplement)
            await session.commit()
            await session.refresh(supplement)
            return supplement.id

    import asyncio

    return asyncio.run(_create())


def create_therapy(name: str, category: TherapyCategory = TherapyCategory.other):
    async def _create():
        async with async_session_factory() as session:
            therapy = Therapy(
                name=name,
                category=category,
                ai_profile={"tags": [name.lower().replace(" ", "_")]},
            )
            session.add(therapy)
            await session.commit()
            await session.refresh(therapy)
            return therapy.id

    import asyncio

    return asyncio.run(_create())


def create_user_supplement(
    user_id: str,
    supplement_id,
    *,
    frequency: Frequency = Frequency.daily,
    take_window: TakeWindow = TakeWindow.morning_with_food,
    started_at: date = date(2026, 4, 1),
    dosage_amount: float = 1,
    dosage_unit: str = "capsule",
    with_food: bool = False,
):
    async def _create():
        async with async_session_factory() as session:
            user_supplement = UserSupplement(
                user_id=user_id,
                supplement_id=supplement_id,
                dosage_amount=dosage_amount,
                dosage_unit=dosage_unit,
                frequency=frequency,
                take_window=take_window,
                with_food=with_food,
                started_at=started_at,
            )
            session.add(user_supplement)
            await session.commit()
            await session.refresh(user_supplement)
            return user_supplement.id

    import asyncio

    return asyncio.run(_create())


def create_user_therapy(
    user_id: str,
    therapy_id,
    *,
    frequency: Frequency = Frequency.daily,
    take_window: TakeWindow = TakeWindow.afternoon,
    started_at: date = date(2026, 4, 1),
    duration_minutes: int = 20,
    notes: str | None = None,
    session_details: str | None = None,
):
    async def _create():
        async with async_session_factory() as session:
            user_therapy = UserTherapy(
                user_id=user_id,
                therapy_id=therapy_id,
                duration_minutes=duration_minutes,
                frequency=frequency,
                take_window=take_window,
                settings={"session_details": session_details} if session_details else None,
                notes=notes,
                started_at=started_at,
            )
            session.add(user_therapy)
            await session.commit()
            await session.refresh(user_therapy)
            return user_therapy.id

    import asyncio

    return asyncio.run(_create())


def create_adherence_log(user_id: str, item_id, *, item_type: str = "supplement"):
    async def _create():
        async with async_session_factory() as session:
            log = AdherenceLog(
                user_id=user_id,
                item_type=item_type,
                item_id=item_id,
                scheduled_at=datetime(2026, 4, 8, 8, 0, tzinfo=timezone.utc),
                taken_at=datetime(2026, 4, 8, 8, 5, tzinfo=timezone.utc),
            )
            session.add(log)
            await session.commit()

    import asyncio

    asyncio.run(_create())


def test_daily_plan_groups_due_items_by_take_window(client):
    headers, user_id = signup(client)

    creatine_id = create_supplement("Creatine Monohydrate")
    fish_oil_id = create_supplement("Fish Oil")
    melatonin_id = create_supplement("Melatonin")
    rhodiola_id = create_supplement("Rhodiola")

    create_user_supplement(
        user_id,
        creatine_id,
        frequency=Frequency.daily,
        take_window=TakeWindow.morning_with_food,
        dosage_amount=5,
        dosage_unit="g",
        with_food=True,
    )
    create_user_supplement(
        user_id,
        fish_oil_id,
        frequency=Frequency.weekly,
        take_window=TakeWindow.midday,
        started_at=date(2026, 4, 1),
        dosage_amount=2,
        dosage_unit="softgels",
        with_food=True,
    )
    create_user_supplement(
        user_id,
        melatonin_id,
        frequency=Frequency.daily,
        take_window=TakeWindow.bedtime,
        dosage_amount=1,
        dosage_unit="mg",
    )
    create_user_supplement(
        user_id,
        rhodiola_id,
        frequency=Frequency.every_other_day,
        take_window=TakeWindow.morning_fasted,
        started_at=date(2026, 4, 7),
        dosage_amount=1,
        dosage_unit="capsule",
    )
    infrared_id = create_therapy("Infrared Panel", TherapyCategory.light)
    create_user_therapy(
        user_id,
        infrared_id,
        take_window=TakeWindow.afternoon,
        duration_minutes=16,
        notes="Rotate body sides evenly",
        session_details="4 min per side",
    )

    response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["date"] == "2026-04-08"
    windows = {window["window"]: window for window in body["windows"]}

    assert [window["window"] for window in body["windows"]] == [
        "morning_fasted",
        "morning_with_food",
        "midday",
        "afternoon",
        "evening",
        "bedtime",
    ]
    assert windows["morning_fasted"]["items"] == []
    assert windows["morning_with_food"]["items"][0]["name"] == "Creatine Monohydrate"
    assert windows["morning_with_food"]["items"][0]["instructions"] == "Once daily. Take with food"
    assert windows["midday"]["items"][0]["name"] == "Fish Oil"
    assert windows["afternoon"]["items"][0] == {
        "id": windows["afternoon"]["items"][0]["id"],
        "name": "Infrared Panel",
        "type": "therapy",
        "details": "16 min · 4 min per side",
        "instructions": "Once daily. Rotate body sides evenly",
        "is_on_cycle": True,
        "adherence_status": "pending",
    }
    assert windows["bedtime"]["items"][0]["name"] == "Melatonin"

    scheduled_names = [
        item["name"]
        for window in body["windows"]
        for item in window["items"]
    ]
    assert "Rhodiola" not in scheduled_names
    assert body["interactions"] == []


def test_daily_plan_surfaces_interactions_and_adherence(client):
    headers, user_id = signup(client)

    vitamin_d_id = create_supplement(
        "Vitamin D3",
        ai_profile={
            "common_names": ["Vitamin D3"],
            "known_interactions": [
                {
                    "substance": "magnesium_glycinate",
                    "type": "caution",
                    "severity": "moderate",
                    "description": "May require coordinated dosing.",
                }
            ],
        },
    )
    magnesium_id = create_supplement(
        "Magnesium Glycinate",
        ai_profile={"common_names": ["Magnesium Glycinate"], "known_interactions": []},
    )

    vitamin_user_item_id = create_user_supplement(
        user_id,
        vitamin_d_id,
        take_window=TakeWindow.morning_with_food,
        with_food=True,
    )
    breathwork_id = create_therapy("Coherence Breathwork", TherapyCategory.breathwork)
    breathwork_user_item_id = create_user_therapy(
        user_id,
        breathwork_id,
        take_window=TakeWindow.morning_with_food,
        session_details="5.5 breaths per minute",
    )
    create_user_supplement(
        user_id,
        magnesium_id,
        take_window=TakeWindow.evening,
    )
    create_adherence_log(user_id, vitamin_user_item_id)
    create_adherence_log(user_id, breathwork_user_item_id, item_type="therapy")

    response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["interactions"] == [
        {
            "supplement_a": "Vitamin D3",
            "supplement_b": "Magnesium Glycinate",
            "type": "caution",
            "severity": "moderate",
            "description": "May require coordinated dosing.",
        }
    ]

    windows = {window["window"]: window for window in body["windows"]}
    assert windows["morning_with_food"]["items"][0]["adherence_status"] == "taken"
    assert windows["morning_with_food"]["items"][1]["adherence_status"] == "taken"
