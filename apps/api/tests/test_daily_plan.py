from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.medication import Medication, MedicationCategory
from app.models.nutrition_cycle import NutritionCycle
from app.models.supplement import Supplement, SupplementCategory
from app.models.therapy import Therapy, TherapyCategory
from app.models.user_medication import UserMedication
from app.models.enums import Frequency, TakeWindow
from app.models.user_supplement import UserSupplement
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


def update_user_location(
    user_id: str,
    *,
    location_name: str = "Barcelona",
    latitude: float = 41.3874,
    longitude: float = 2.1686,
):
    async def _update():
        async with async_session_factory() as session:
            from app.models.user import User

            result = await session.execute(select(User).where(User.id == user_id))
            user = result.scalar_one()
            user.location_name = location_name
            user.latitude = latitude
            user.longitude = longitude
            await session.commit()

    import asyncio

    asyncio.run(_update())


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


def create_medication(name: str, ai_profile=None):
    async def _create():
        async with async_session_factory() as session:
            medication = Medication(
                name=name,
                category=MedicationCategory.other,
                form="tablet",
                ai_profile=ai_profile,
                is_verified=True,
            )
            session.add(medication)
            await session.commit()
            await session.refresh(medication)
            return medication.id

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


def create_user_medication(
    user_id: str,
    medication_id,
    *,
    frequency: Frequency = Frequency.daily,
    take_window: TakeWindow = TakeWindow.evening,
    started_at: date = date(2026, 4, 1),
    dosage_amount: float = 1,
    dosage_unit: str = "tablet",
    with_food: bool = False,
):
    async def _create():
        async with async_session_factory() as session:
            user_medication = UserMedication(
                user_id=user_id,
                medication_id=medication_id,
                dosage_amount=dosage_amount,
                dosage_unit=dosage_unit,
                frequency=frequency,
                take_window=take_window,
                with_food=with_food,
                started_at=started_at,
            )
            session.add(user_medication)
            await session.commit()
            await session.refresh(user_medication)
            return user_medication.id

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


def create_nutrition_cycle(
    user_id: str,
    *,
    name: str = "Low Carb Rhythm",
    cycle_type: str = "macro_profile",
    phase_started_at: date = date(2026, 4, 7),
    phases: list[dict] | None = None,
):
    async def _create():
        async with async_session_factory() as session:
            cycle_phases = phases or [
                {
                    "name": "Low Carb",
                    "duration_days": 2,
                    "macro_profile": {"carbs": "low", "protein": "high", "fat": "medium"},
                    "pattern": None,
                    "restrictions": ["No refined sugar"],
                    "notes": "Base training days",
                },
                {
                    "name": "High Carb",
                    "duration_days": 1,
                    "macro_profile": {"carbs": "high", "protein": "medium", "fat": "low"},
                    "pattern": "Refeed",
                    "restrictions": [],
                    "notes": "Hard training day",
                },
            ]
            nutrition_cycle = NutritionCycle(
                user_id=user_id,
                cycle_type=cycle_type,
                name=name,
                phases=cycle_phases,
                current_phase_idx=0,
                phase_started_at=phase_started_at,
                next_transition=phase_started_at + timedelta(days=cycle_phases[0]["duration_days"]),
                is_active=True,
            )
            session.add(nutrition_cycle)
            await session.commit()
            await session.refresh(nutrition_cycle)
            return nutrition_cycle.id

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
    finasteride_id = create_medication("Finasteride")
    create_user_medication(
        user_id,
        finasteride_id,
        take_window=TakeWindow.evening,
        dosage_amount=1,
        dosage_unit="mg",
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
        "regimes": [],
        "is_on_cycle": True,
        "adherence_status": "pending",
    }
    assert windows["bedtime"]["items"][0]["name"] == "Melatonin"
    assert windows["evening"]["items"][0]["name"] == "Finasteride"
    assert windows["evening"]["items"][0]["type"] == "medication"

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
                    "substance": "finasteride",
                    "type": "caution",
                    "severity": "moderate",
                    "description": "Review combined use and monitor for overlapping effects.",
                }
            ],
        },
    )
    magnesium_id = create_supplement(
        "Magnesium Glycinate",
        ai_profile={"common_names": ["Magnesium Glycinate"], "known_interactions": []},
    )
    finasteride_id = create_medication(
        "Finasteride",
        ai_profile={"common_names": ["Finasteride"], "known_interactions": []},
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
    create_user_medication(
        user_id,
        finasteride_id,
        take_window=TakeWindow.midday,
        dosage_amount=1,
        dosage_unit="mg",
    )
    create_adherence_log(user_id, vitamin_user_item_id)
    create_adherence_log(user_id, breathwork_user_item_id, item_type="therapy")

    response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["interactions"] == [
        {
            "item_a": "Vitamin D3",
            "item_b": "Finasteride",
            "type": "caution",
            "severity": "moderate",
            "description": "Review combined use and monitor for overlapping effects.",
        }
    ]

    windows = {window["window"]: window for window in body["windows"]}
    assert windows["morning_with_food"]["items"][0]["adherence_status"] == "taken"
    assert windows["morning_with_food"]["items"][1]["adherence_status"] == "taken"
    assert windows["morning_with_food"]["items"][1]["regimes"] == []


def test_daily_plan_includes_active_nutrition_phase_and_transition_alert(client):
    headers, user_id = signup(client)

    create_nutrition_cycle(user_id)

    response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["nutrition_phase"] == {
        "plan_name": "Low Carb Rhythm",
        "cycle_type": "macro_profile",
        "current_phase_idx": 0,
        "total_phases": 2,
        "next_transition": "2026-04-09",
        "days_until_transition": 1,
        "name": "Low Carb",
        "duration_days": 2,
        "macro_profile": {"carbs": "low", "protein": "high", "fat": "medium"},
        "pattern": None,
        "restrictions": ["No refined sugar"],
        "notes": "Base training days",
    }
    assert body["cycle_alerts"] == [
        {
            "item_name": "Low Carb Rhythm",
            "message": "Transition to High Carb in 1 day.",
            "days_until_transition": 1,
        }
    ]


def test_daily_plan_includes_skincare_guidance_when_uv_is_available(client, monkeypatch):
    headers, user_id = signup(client)
    update_user_location(user_id)

    async def fake_build_skincare_guidance(_user):
        return {
            "location_name": "Barcelona",
            "uv_index": 7.2,
            "level": "high",
            "is_day": True,
            "recommended_spf": 50,
            "reapply_hours": 2,
            "headline": "High UV exposure",
            "recommendation": "Use SPF 50+, reapply every 2 hours, and add shade, hat, or protective clothing if you will be outside.",
        }

    monkeypatch.setattr("app.services.daily_plan.build_skincare_guidance", fake_build_skincare_guidance)

    response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["skincare_guidance"] == {
        "location_name": "Barcelona",
        "uv_index": 7.2,
        "level": "high",
        "is_day": True,
        "recommended_spf": 50,
        "reapply_hours": 2,
        "headline": "High UV exposure",
        "recommendation": "Use SPF 50+, reapply every 2 hours, and add shade, hat, or protective clothing if you will be outside.",
    }


def test_daily_plan_includes_skincare_guidance_when_uv_data_is_available(client, monkeypatch):
    headers, user_id = signup(client)
    update_user_location(user_id)

    async def _fake_guidance(_user):
        return {
            "location_name": "Barcelona",
            "uv_index": 7.4,
            "level": "high",
            "is_day": True,
            "recommended_spf": 50,
            "reapply_hours": 2,
            "headline": "High UV exposure",
            "recommendation": "Use SPF 50+, reapply every 2 hours, and add shade, hat, or protective clothing if you will be outside.",
        }

    monkeypatch.setattr("app.services.daily_plan.build_skincare_guidance", _fake_guidance)

    response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["skincare_guidance"] == {
        "location_name": "Barcelona",
        "uv_index": 7.4,
        "level": "high",
        "is_day": True,
        "recommended_spf": 50,
        "reapply_hours": 2,
        "headline": "High UV exposure",
        "recommendation": "Use SPF 50+, reapply every 2 hours, and add shade, hat, or protective clothing if you will be outside.",
    }


def test_daily_plan_only_includes_items_from_active_scheduled_regimes(client):
    headers, user_id = signup(client)

    creatine_id = create_supplement("Creatine")
    magnesium_id = create_supplement("Magnesium")
    creatine_user_item_id = create_user_supplement(user_id, creatine_id)
    magnesium_user_item_id = create_user_supplement(user_id, magnesium_id)

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Vacation Plan",
            "schedule": {"type": "manual", "manual_is_active": False},
            "user_supplement_ids": [str(creatine_user_item_id)],
        },
        headers=headers,
    )
    assert response.status_code == 201

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Baseline Stack",
            "user_supplement_ids": [str(magnesium_user_item_id)],
        },
        headers=headers,
    )
    assert response.status_code == 201

    plan_response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)
    assert plan_response.status_code == 200
    scheduled_names = [
        item["name"]
        for window in plan_response.json()["windows"]
        for item in window["items"]
    ]
    assert "Creatine" not in scheduled_names
    assert "Magnesium" in scheduled_names


def test_daily_plan_honors_week_of_month_protocol_regimes(client):
    headers, user_id = signup(client)

    zinc_id = create_supplement("Zinc")
    zinc_user_item_id = create_user_supplement(user_id, zinc_id)

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Week One Reset",
            "schedule": {"type": "week_of_month", "weeks_of_month": [1]},
            "user_supplement_ids": [str(zinc_user_item_id)],
        },
        headers=headers,
    )
    assert response.status_code == 201

    hidden_response = client.get("/api/v1/users/me/daily-plan?date=2026-04-08", headers=headers)
    assert hidden_response.status_code == 200
    hidden_names = [
        item["name"]
        for window in hidden_response.json()["windows"]
        for item in window["items"]
    ]
    assert "Zinc" not in hidden_names

    active_response = client.get("/api/v1/users/me/daily-plan?date=2026-04-03", headers=headers)
    assert active_response.status_code == 200
    active_items = [
        item
        for window in active_response.json()["windows"]
        for item in window["items"]
        if item["name"] == "Zinc"
    ]
    assert len(active_items) == 1
    assert active_items[0]["regimes"] == ["Week One Reset"]
