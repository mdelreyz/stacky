from datetime import date

from app.database import async_session_factory
from app.models.medication import Medication, MedicationCategory
from app.models.supplement import Supplement, SupplementCategory
from app.models.therapy import Therapy, TherapyCategory
from app.models.user_medication import UserMedication
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy


def signup(client, email: str) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Stack",
            "last_name": "Builder",
            "email": email,
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

    import asyncio

    return asyncio.run(_create())


def create_therapy(name: str):
    async def _create():
        async with async_session_factory() as session:
            therapy = Therapy(name=name, category=TherapyCategory.other)
            session.add(therapy)
            await session.commit()
            await session.refresh(therapy)
            return therapy.id

    import asyncio

    return asyncio.run(_create())


def create_medication(name: str):
    async def _create():
        async with async_session_factory() as session:
            medication = Medication(name=name, category=MedicationCategory.prescription, form="tablet")
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
    dosage_amount: float = 1,
    dosage_unit: str = "capsule",
):
    async def _create():
        async with async_session_factory() as session:
            user_supplement = UserSupplement(
                user_id=user_id,
                supplement_id=supplement_id,
                dosage_amount=dosage_amount,
                dosage_unit=dosage_unit,
                frequency="daily",
                take_window="morning_with_food",
                with_food=True,
                started_at=date(2026, 4, 8),
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
    dosage_amount: float = 1,
    dosage_unit: str = "tablet",
):
    async def _create():
        async with async_session_factory() as session:
            user_medication = UserMedication(
                user_id=user_id,
                medication_id=medication_id,
                dosage_amount=dosage_amount,
                dosage_unit=dosage_unit,
                frequency="daily",
                take_window="evening",
                started_at=date(2026, 4, 8),
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
    duration_minutes: int = 20,
):
    async def _create():
        async with async_session_factory() as session:
            user_therapy = UserTherapy(
                user_id=user_id,
                therapy_id=therapy_id,
                duration_minutes=duration_minutes,
                frequency="daily",
                take_window="evening",
                started_at=date(2026, 4, 8),
            )
            session.add(user_therapy)
            await session.commit()
            await session.refresh(user_therapy)
            return user_therapy.id

    import asyncio

    return asyncio.run(_create())


def test_create_protocol_preserves_membership_order(client):
    headers, user_id = signup(client, "stacks@example.com")
    magnesium_id = create_supplement("Magnesium Glycinate")
    d3_id = create_supplement("Vitamin D3")

    magnesium_user_id = create_user_supplement(user_id, magnesium_id)
    d3_user_id = create_user_supplement(user_id, d3_id, dosage_amount=2, dosage_unit="softgels")

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Morning Stack",
            "description": "Core morning supplements",
            "user_supplement_ids": [str(d3_user_id), str(magnesium_user_id)],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Morning Stack"
    assert [item["user_supplement"]["supplement"]["name"] for item in body["items"]] == [
        "Vitamin D3",
        "Magnesium Glycinate",
    ]
    assert [item["sort_order"] for item in body["items"]] == [0, 1]

    list_response = client.get("/api/v1/users/me/protocols", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1


def test_protocol_rejects_supplements_from_other_accounts(client):
    headers, user_id = signup(client, "owner@example.com")
    _, other_user_id = signup(client, "other@example.com")
    owned_id = create_supplement("Creatine")
    foreign_id = create_supplement("NAC")

    owned_user_supplement_id = create_user_supplement(user_id, owned_id)
    foreign_user_supplement_id = create_user_supplement(other_user_id, foreign_id)

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Invalid Stack",
            "user_supplement_ids": [
                str(owned_user_supplement_id),
                str(foreign_user_supplement_id),
            ],
        },
        headers=headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Protocol items must reference supplements, medications, or therapies in your account"


def test_protocol_can_include_therapy_members(client):
    headers, user_id = signup(client, "mixed-stack@example.com")
    magnesium_id = create_supplement("Magnesium")
    sauna_id = create_therapy("Sauna")

    magnesium_user_id = create_user_supplement(user_id, magnesium_id)
    sauna_user_id = create_user_therapy(user_id, sauna_id)

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Recovery Stack",
            "user_supplement_ids": [str(magnesium_user_id)],
            "user_therapy_ids": [str(sauna_user_id)],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert [item["item_type"] for item in body["items"]] == ["supplement", "therapy"]
    assert body["items"][1]["user_therapy"]["therapy"]["name"] == "Sauna"


def test_protocol_can_include_medication_members(client):
    headers, user_id = signup(client, "hair-stack@example.com")
    magnesium_id = create_supplement("Magnesium")
    finasteride_id = create_medication("Finasteride")

    magnesium_user_id = create_user_supplement(user_id, magnesium_id)
    finasteride_user_id = create_user_medication(user_id, finasteride_id)

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Hair Stack",
            "user_supplement_ids": [str(magnesium_user_id)],
            "user_medication_ids": [str(finasteride_user_id)],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert [item["item_type"] for item in body["items"]] == ["supplement", "medication"]
    assert body["items"][1]["user_medication"]["medication"]["name"] == "Finasteride"


def test_protocol_keeps_inactive_members_visible_and_editable(client):
    headers, user_id = signup(client, "inactive@example.com")
    magnesium_id = create_supplement("Magnesium")
    zinc_id = create_supplement("Zinc")

    magnesium_user_id = create_user_supplement(user_id, magnesium_id)
    zinc_user_id = create_user_supplement(user_id, zinc_id)

    create_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Evening Stack",
            "user_supplement_ids": [str(magnesium_user_id), str(zinc_user_id)],
        },
        headers=headers,
    )
    protocol_id = create_response.json()["id"]

    remove_response = client.delete(f"/api/v1/users/me/supplements/{magnesium_user_id}", headers=headers)
    assert remove_response.status_code == 204

    get_response = client.get(f"/api/v1/users/me/protocols/{protocol_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["items"][0]["user_supplement"]["is_active"] is False

    update_response = client.patch(
        f"/api/v1/users/me/protocols/{protocol_id}",
        json={"description": "Still references stopped items for cleanup"},
        headers=headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["description"] == "Still references stopped items for cleanup"


def test_protocol_can_store_manual_schedule_state(client):
    headers, user_id = signup(client, "scheduled@example.com")
    magnesium_id = create_supplement("Magnesium")
    magnesium_user_id = create_user_supplement(user_id, magnesium_id)

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Vacation Stack",
            "schedule": {"type": "manual", "manual_is_active": True},
            "user_supplement_ids": [str(magnesium_user_id)],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["schedule"] == {
        "type": "manual",
        "manual_is_active": True,
        "start_date": None,
        "end_date": None,
        "weeks_of_month": [],
    }
    assert body["schedule_summary"] == "Manual regime is active"
    assert body["is_currently_active"] is True


def test_protocol_schedule_can_be_cleared(client):
    headers, user_id = signup(client, "clear-schedule@example.com")
    magnesium_id = create_supplement("Magnesium")
    magnesium_user_id = create_user_supplement(user_id, magnesium_id)

    create_response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Reset Stack",
            "schedule": {"type": "manual", "manual_is_active": False},
            "user_supplement_ids": [str(magnesium_user_id)],
        },
        headers=headers,
    )
    assert create_response.status_code == 201
    protocol_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/users/me/protocols/{protocol_id}",
        json={"schedule": None},
        headers=headers,
    )

    assert update_response.status_code == 200
    body = update_response.json()
    assert body["schedule"] is None
    assert body["schedule_summary"] == "Always available"
    assert body["is_currently_active"] is True


def test_protocol_rejects_invalid_week_of_month_schedule(client):
    headers, user_id = signup(client, "invalid-schedule@example.com")
    magnesium_id = create_supplement("Magnesium")
    magnesium_user_id = create_user_supplement(user_id, magnesium_id)

    response = client.post(
        "/api/v1/users/me/protocols",
        json={
            "name": "Invalid Schedule",
            "schedule": {"type": "week_of_month", "weeks_of_month": [0, 2]},
            "user_supplement_ids": [str(magnesium_user_id)],
        },
        headers=headers,
    )

    assert response.status_code == 422
