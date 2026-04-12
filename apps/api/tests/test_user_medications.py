import asyncio

from app.database import async_session_factory
from app.models.medication import Medication, MedicationCategory


def auth_headers(client, email: str = "user-medications@example.com"):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Medication",
            "last_name": "Builder",
            "email": email,
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_medication(name: str):
    async def _create():
        async with async_session_factory() as session:
            medication = Medication(name=name, category=MedicationCategory.other, form="tablet")
            session.add(medication)
            await session.commit()
            await session.refresh(medication)
            return medication.id

    return asyncio.run(_create())


def test_add_user_medication_rejects_duplicate_active_entry(client):
    headers = auth_headers(client)
    medication_id = create_medication("Finasteride")

    payload = {
        "medication_id": str(medication_id),
        "dosage_amount": 1,
        "dosage_unit": "mg",
        "frequency": "daily",
        "take_window": "morning_with_food",
        "with_food": False,
        "started_at": "2026-04-08",
    }

    first_response = client.post("/api/v1/users/me/medications", json=payload, headers=headers)
    assert first_response.status_code == 201
    created = first_response.json()

    get_response = client.get(f"/api/v1/users/me/medications/{created['id']}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["medication"]["name"] == "Finasteride"

    second_response = client.post("/api/v1/users/me/medications", json=payload, headers=headers)
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Medication already active in your protocol"


def test_remove_user_medication_soft_deactivates_entry(client):
    headers = auth_headers(client)
    medication_id = create_medication("Oral Minoxidil")

    create_response = client.post(
        "/api/v1/users/me/medications",
        json={
            "medication_id": str(medication_id),
            "dosage_amount": 2.5,
            "dosage_unit": "mg",
            "frequency": "daily",
            "take_window": "evening",
            "with_food": False,
            "started_at": "2026-04-08",
        },
        headers=headers,
    )
    user_medication_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/users/me/medications/{user_medication_id}", headers=headers)
    assert delete_response.status_code == 204

    active_list_response = client.get("/api/v1/users/me/medications?active_only=true", headers=headers)
    assert active_list_response.status_code == 200
    assert active_list_response.json()["items"] == []

    get_response = client.get(f"/api/v1/users/me/medications/{user_medication_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is False
    assert get_response.json()["ended_at"] is not None


def test_update_user_medication_and_include_inactive_entries(client):
    headers = auth_headers(client)
    medication_id = create_medication("Metformin")

    create_response = client.post(
        "/api/v1/users/me/medications",
        json={
            "medication_id": str(medication_id),
            "dosage_amount": 500,
            "dosage_unit": "mg",
            "frequency": "daily",
            "take_window": "morning_with_food",
            "with_food": True,
            "started_at": "2026-04-08",
        },
        headers=headers,
    )
    user_medication_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/users/me/medications/{user_medication_id}",
        json={
            "dosage_amount": 750,
            "take_window": "evening",
            "with_food": False,
            "notes": "Move after dinner",
        },
        headers=headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["dosage_amount"] == 750
    assert updated["take_window"] == "evening"
    assert updated["with_food"] is False
    assert updated["notes"] == "Move after dinner"

    delete_response = client.delete(f"/api/v1/users/me/medications/{user_medication_id}", headers=headers)
    assert delete_response.status_code == 204

    active_only_response = client.get("/api/v1/users/me/medications", headers=headers)
    assert active_only_response.status_code == 200
    assert active_only_response.json()["items"] == []

    all_items_response = client.get("/api/v1/users/me/medications?active_only=false", headers=headers)
    assert all_items_response.status_code == 200
    all_items = all_items_response.json()["items"]
    assert len(all_items) == 1
    assert all_items[0]["id"] == user_medication_id
    assert all_items[0]["is_active"] is False
    assert all_items[0]["notes"] == "Move after dinner"


def test_user_medication_routes_are_scoped_to_current_user(client):
    owner_headers = auth_headers(client, "owner-medications@example.com")
    other_headers = auth_headers(client, "other-medications@example.com")
    medication_id = create_medication("Finasteride")

    create_response = client.post(
        "/api/v1/users/me/medications",
        json={
            "medication_id": str(medication_id),
            "dosage_amount": 1,
            "dosage_unit": "mg",
            "frequency": "daily",
            "take_window": "morning_with_food",
            "with_food": False,
            "started_at": "2026-04-08",
        },
        headers=owner_headers,
    )
    user_medication_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/users/me/medications/{user_medication_id}", headers=other_headers)
    assert get_response.status_code == 404

    patch_response = client.patch(
        f"/api/v1/users/me/medications/{user_medication_id}",
        json={"notes": "Not your record"},
        headers=other_headers,
    )
    assert patch_response.status_code == 404

    delete_response = client.delete(f"/api/v1/users/me/medications/{user_medication_id}", headers=other_headers)
    assert delete_response.status_code == 404
