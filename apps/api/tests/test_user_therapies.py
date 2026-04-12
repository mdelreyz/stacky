import asyncio
import uuid

from app.database import async_session_factory
from app.models.therapy import Therapy, TherapyCategory


def auth_headers(client, email: str = "user-therapies@example.com"):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Therapy",
            "last_name": "Builder",
            "email": email,
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_therapy(name: str):
    async def _create():
        async with async_session_factory() as session:
            therapy = Therapy(name=name, category=TherapyCategory.other)
            session.add(therapy)
            await session.commit()
            await session.refresh(therapy)
            return therapy.id

    return asyncio.run(_create())


def test_add_user_therapy_rejects_duplicate_active_entry(client):
    headers = auth_headers(client)
    therapy_id = create_therapy("HBOT")

    payload = {
        "therapy_id": str(therapy_id),
        "duration_minutes": 60,
        "frequency": "daily",
        "take_window": "afternoon",
        "settings": {"session_details": "2.0 ATA"},
        "started_at": "2026-04-08",
    }

    first_response = client.post("/api/v1/users/me/therapies", json=payload, headers=headers)
    assert first_response.status_code == 201
    created = first_response.json()
    assert created["settings"]["session_details"] == "2.0 ATA"

    get_response = client.get(f"/api/v1/users/me/therapies/{created['id']}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["therapy"]["name"] == "HBOT"

    second_response = client.post("/api/v1/users/me/therapies", json=payload, headers=headers)
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Therapy already active in your protocol"


def test_remove_user_therapy_soft_deactivates_entry(client):
    headers = auth_headers(client)
    therapy_id = create_therapy("Muse 2")

    create_response = client.post(
        "/api/v1/users/me/therapies",
        json={
            "therapy_id": str(therapy_id),
            "duration_minutes": 20,
            "frequency": "daily",
            "take_window": "evening",
            "settings": {"session_details": "Mindfulness block"},
            "started_at": "2026-04-08",
        },
        headers=headers,
    )
    user_therapy_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/users/me/therapies/{user_therapy_id}", headers=headers)
    assert delete_response.status_code == 204

    active_list_response = client.get("/api/v1/users/me/therapies?active_only=true", headers=headers)
    assert active_list_response.status_code == 200
    assert active_list_response.json()["items"] == []

    get_response = client.get(f"/api/v1/users/me/therapies/{user_therapy_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is False
    assert get_response.json()["ended_at"] is not None


def test_update_user_therapy_and_include_inactive_entries(client):
    headers = auth_headers(client)
    therapy_id = create_therapy("Red Light Therapy")

    create_response = client.post(
        "/api/v1/users/me/therapies",
        json={
            "therapy_id": str(therapy_id),
            "duration_minutes": 15,
            "frequency": "daily",
            "take_window": "morning_fasted",
            "settings": {"device": "Panel A"},
            "started_at": "2026-04-08",
        },
        headers=headers,
    )
    user_therapy_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/users/me/therapies/{user_therapy_id}",
        json={
            "duration_minutes": 20,
            "take_window": "evening",
            "settings": {"device": "Panel B"},
            "notes": "Post-workout only",
        },
        headers=headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["duration_minutes"] == 20
    assert updated["take_window"] == "evening"
    assert updated["settings"] == {"device": "Panel B"}
    assert updated["notes"] == "Post-workout only"

    delete_response = client.delete(f"/api/v1/users/me/therapies/{user_therapy_id}", headers=headers)
    assert delete_response.status_code == 204

    active_only_response = client.get("/api/v1/users/me/therapies", headers=headers)
    assert active_only_response.status_code == 200
    assert active_only_response.json()["items"] == []

    all_items_response = client.get("/api/v1/users/me/therapies?active_only=false", headers=headers)
    assert all_items_response.status_code == 200
    all_items = all_items_response.json()["items"]
    assert len(all_items) == 1
    assert all_items[0]["id"] == user_therapy_id
    assert all_items[0]["is_active"] is False
    assert all_items[0]["notes"] == "Post-workout only"


def test_user_therapy_routes_are_scoped_to_current_user(client):
    owner_headers = auth_headers(client, "owner-therapies@example.com")
    other_headers = auth_headers(client, "other-therapies@example.com")
    therapy_id = create_therapy("HBOT")

    create_response = client.post(
        "/api/v1/users/me/therapies",
        json={
            "therapy_id": str(therapy_id),
            "duration_minutes": 60,
            "frequency": "daily",
            "take_window": "afternoon",
            "settings": {"pressure": "2.0 ATA"},
            "started_at": "2026-04-08",
        },
        headers=owner_headers,
    )
    user_therapy_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/users/me/therapies/{user_therapy_id}", headers=other_headers)
    assert get_response.status_code == 404

    patch_response = client.patch(
        f"/api/v1/users/me/therapies/{user_therapy_id}",
        json={"notes": "Not your therapy"},
        headers=other_headers,
    )
    assert patch_response.status_code == 404

    delete_response = client.delete(f"/api/v1/users/me/therapies/{user_therapy_id}", headers=other_headers)
    assert delete_response.status_code == 404


def test_add_user_therapy_requires_existing_catalog_entry(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/users/me/therapies",
        json={
            "therapy_id": str(uuid.uuid4()),
            "duration_minutes": 30,
            "frequency": "daily",
            "take_window": "afternoon",
            "started_at": "2026-04-08",
        },
        headers=headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Therapy not found"
