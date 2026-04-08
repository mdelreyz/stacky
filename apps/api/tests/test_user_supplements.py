import asyncio

from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory


def auth_headers(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Protocol",
            "last_name": "Builder",
            "email": "supplements@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_supplement(name: str):
    async def _create():
        async with async_session_factory() as session:
            supplement = Supplement(name=name, category=SupplementCategory.other)
            session.add(supplement)
            await session.commit()
            await session.refresh(supplement)
            return supplement.id

    return asyncio.run(_create())


def test_add_user_supplement_rejects_duplicate_active_entry(client):
    headers = auth_headers(client)
    supplement_id = create_supplement("CoQ10")

    payload = {
        "supplement_id": str(supplement_id),
        "dosage_amount": 1,
        "dosage_unit": "capsule",
        "frequency": "daily",
        "take_window": "morning_with_food",
        "with_food": True,
        "started_at": "2026-04-08",
    }

    first_response = client.post("/api/v1/users/me/supplements", json=payload, headers=headers)
    assert first_response.status_code == 201
    created = first_response.json()

    get_response = client.get(f"/api/v1/users/me/supplements/{created['id']}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["supplement"]["name"] == "CoQ10"

    second_response = client.post("/api/v1/users/me/supplements", json=payload, headers=headers)
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Supplement already active in your protocol"


def test_remove_user_supplement_soft_deactivates_entry(client):
    headers = auth_headers(client)
    supplement_id = create_supplement("B12")

    create_response = client.post(
        "/api/v1/users/me/supplements",
        json={
          "supplement_id": str(supplement_id),
          "dosage_amount": 1,
          "dosage_unit": "tablet",
          "frequency": "daily",
          "take_window": "morning_with_food",
          "with_food": True,
          "started_at": "2026-04-08",
        },
        headers=headers,
    )
    user_supplement_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/users/me/supplements/{user_supplement_id}", headers=headers)
    assert delete_response.status_code == 204

    active_list_response = client.get("/api/v1/users/me/supplements?active_only=true", headers=headers)
    assert active_list_response.status_code == 200
    assert active_list_response.json()["items"] == []

    get_response = client.get(f"/api/v1/users/me/supplements/{user_supplement_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is False
    assert get_response.json()["ended_at"] is not None


def test_generate_refill_request_from_out_of_stock_supplements(client):
    headers = auth_headers(client)
    magnesium_id = create_supplement("Magnesium Glycinate")
    vitamin_d_id = create_supplement("Vitamin D3")

    magnesium_response = client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": str(magnesium_id),
            "dosage_amount": 2,
            "dosage_unit": "capsules",
            "frequency": "daily",
            "take_window": "evening",
            "with_food": False,
            "started_at": "2026-04-08",
            "notes": "Sleep support",
        },
        headers=headers,
    )
    vitamin_response = client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": str(vitamin_d_id),
            "dosage_amount": 1,
            "dosage_unit": "softgel",
            "frequency": "daily",
            "take_window": "morning_with_food",
            "with_food": True,
            "started_at": "2026-04-08",
        },
        headers=headers,
    )

    assert magnesium_response.status_code == 201
    assert vitamin_response.status_code == 201

    mark_response = client.patch(
        f"/api/v1/users/me/supplements/{magnesium_response.json()['id']}",
        json={"is_out_of_stock": True},
        headers=headers,
    )
    assert mark_response.status_code == 200
    assert mark_response.json()["is_out_of_stock"] is True

    refill_response = client.get("/api/v1/users/me/supplements/refill-request", headers=headers)
    assert refill_response.status_code == 200

    body = refill_response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["supplement_name"] == "Magnesium Glycinate"
    assert "Magnesium Glycinate" in body["text"]
    assert "Vitamin D3" not in body["text"]
