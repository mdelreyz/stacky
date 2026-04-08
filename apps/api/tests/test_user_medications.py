import asyncio

from app.database import async_session_factory
from app.models.medication import Medication, MedicationCategory


def auth_headers(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Medication",
            "last_name": "Builder",
            "email": "user-medications@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_medication(name: str):
    async def _create():
        async with async_session_factory() as session:
            medication = Medication(name=name, category=MedicationCategory.prescription, form="tablet")
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
