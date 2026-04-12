import asyncio
import uuid

from app.database import async_session_factory
from app.models.therapy import Therapy, TherapyCategory


def auth_headers(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Therapy",
            "last_name": "Catalog",
            "email": "therapies@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_therapy(name: str, category: TherapyCategory = TherapyCategory.other):
    async def _create():
        async with async_session_factory() as session:
            therapy = Therapy(
                name=name,
                category=category,
                description=f"{name} description",
                ai_profile={"tags": [name.lower().replace(" ", "_")]},
            )
            session.add(therapy)
            await session.commit()
            await session.refresh(therapy)
            return therapy.id

    return asyncio.run(_create())


def test_list_therapies_supports_search_and_get(client):
    headers = auth_headers(client)
    sauna_id = create_therapy("Infrared Sauna", TherapyCategory.thermal)
    create_therapy("Muse 2 Meditation", TherapyCategory.sound)

    list_response = client.get("/api/v1/therapies?search=sauna", headers=headers)
    assert list_response.status_code == 200
    assert [item["name"] for item in list_response.json()["items"]] == ["Infrared Sauna"]

    get_response = client.get(f"/api/v1/therapies/{sauna_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["category"] == "thermal"


def test_list_therapies_filters_by_category_and_missing_entries_404(client):
    headers = auth_headers(client)
    create_therapy("Red Light Panel", TherapyCategory.light)
    create_therapy("Cold Plunge", TherapyCategory.thermal)

    list_response = client.get("/api/v1/therapies?category=light", headers=headers)
    assert list_response.status_code == 200
    assert [item["name"] for item in list_response.json()["items"]] == ["Red Light Panel"]

    missing_response = client.get(f"/api/v1/therapies/{uuid.uuid4()}", headers=headers)
    assert missing_response.status_code == 404


def test_list_therapies_paginates_in_name_order(client):
    headers = auth_headers(client)
    create_therapy("Cold Plunge", TherapyCategory.thermal)
    create_therapy("Breath Trainer", TherapyCategory.breathwork)

    response = client.get("/api/v1/therapies?page=2&page_size=1", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["has_more"] is False
    assert [item["name"] for item in body["items"]] == ["Cold Plunge"]
