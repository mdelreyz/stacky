import asyncio

from app.database import async_session_factory
from app.models.medication import Medication, MedicationCategory


def auth_headers(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Medication",
            "last_name": "Catalog",
            "email": "medications@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_medication(name: str, category: MedicationCategory = MedicationCategory.other):
    async def _create():
        async with async_session_factory() as session:
            medication = Medication(
                name=name,
                category=category,
                form="tablet",
                description=f"{name} description",
                ai_profile={"common_names": [name]},
                is_verified=True,
            )
            session.add(medication)
            await session.commit()
            await session.refresh(medication)
            return medication.id

    return asyncio.run(_create())


def test_list_medications_supports_search_and_get(client):
    headers = auth_headers(client)
    finasteride_id = create_medication("Finasteride", MedicationCategory.dermatological)
    create_medication("Topical Minoxidil 5%", MedicationCategory.dermatological)

    list_response = client.get("/api/v1/medications?search=fin", headers=headers)
    assert list_response.status_code == 200
    assert [item["name"] for item in list_response.json()["items"]] == ["Finasteride"]

    get_response = client.get(f"/api/v1/medications/{finasteride_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["category"] == "dermatological"
