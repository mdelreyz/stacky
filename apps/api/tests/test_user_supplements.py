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
