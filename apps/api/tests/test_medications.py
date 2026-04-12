import asyncio

from app.database import async_session_factory
from app.models.medication import Medication, MedicationCategory
from app.routes import medications as medications_route


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


def test_list_medications_filters_by_category(client):
    headers = auth_headers(client)
    create_medication("Metformin", MedicationCategory.metabolic)
    create_medication("Topical Spironolactone", MedicationCategory.dermatological)

    response = client.get("/api/v1/medications?category=metabolic", headers=headers)

    assert response.status_code == 200
    assert [item["name"] for item in response.json()["items"]] == ["Metformin"]


def test_onboard_new_medication_dispatches_generation(client, monkeypatch):
    headers = auth_headers(client)
    dispatched_ids = []
    monkeypatch.setattr(medications_route, "get_ai_unavailable_reason", lambda: None)
    monkeypatch.setattr(
        medications_route.generate_medication_ai_profile,
        "delay",
        lambda medication_id: dispatched_ids.append(medication_id),
    )

    response = client.post(
        "/api/v1/medications/onboard",
        json={"name": "Low Dose Naltrexone", "category": "other", "form": "capsule"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "generating"
    assert body["ai_profile"] is None
    assert body["ai_error"] is None
    assert dispatched_ids == [body["id"]]

    detail = client.get(f"/api/v1/medications/{body['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["ai_status"] == "generating"
    assert detail.json()["form"] == "capsule"


def test_onboard_existing_ready_medication_reuses_profile(client, monkeypatch):
    medication_id = create_medication("Metformin XR", MedicationCategory.metabolic)
    headers = auth_headers(client)
    dispatched_ids = []
    monkeypatch.setattr(medications_route, "get_ai_unavailable_reason", lambda: None)
    monkeypatch.setattr(
        medications_route.generate_medication_ai_profile,
        "delay",
        lambda medication_id: dispatched_ids.append(medication_id),
    )

    response = client.post(
        "/api/v1/medications/onboard",
        json={"name": "metformin xr", "category": "metabolic", "form": "tablet"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == str(medication_id)
    assert body["status"] == "ready"
    assert body["ai_profile"] == {"common_names": ["Metformin XR"]}
    assert body["ai_error"] is None
    assert dispatched_ids == []
