import asyncio

from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory
from app.routes import supplements as supplements_route
from app.services.ai_onboarding import set_ai_status


def auth_headers(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


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

    return asyncio.run(_create())


def test_onboard_new_supplement_dispatches_generation(client, monkeypatch):
    headers = auth_headers(client)
    dispatched_ids = []
    monkeypatch.setattr(supplements_route, "get_ai_unavailable_reason", lambda: None)
    monkeypatch.setattr(
        supplements_route.generate_ai_profile,
        "delay",
        lambda supplement_id: dispatched_ids.append(supplement_id),
    )

    response = client.post(
        "/api/v1/supplements/onboard",
        json={"name": "Berberine"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "generating"
    assert body["ai_profile"] is None
    assert body["ai_error"] is None
    assert dispatched_ids == [body["id"]]

    detail = client.get(f"/api/v1/supplements/{body['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["ai_status"] == "generating"
    assert detail.json()["ai_error"] is None


def test_onboard_existing_ready_supplement_reuses_profile(client, monkeypatch):
    supplement_id = create_supplement("Creatine Monohydrate", ai_profile={"summary": "ready"})
    headers = auth_headers(client)
    dispatched_ids = []
    monkeypatch.setattr(supplements_route, "get_ai_unavailable_reason", lambda: None)
    monkeypatch.setattr(
        supplements_route.generate_ai_profile,
        "delay",
        lambda supplement_id: dispatched_ids.append(supplement_id),
    )

    response = client.post(
        "/api/v1/supplements/onboard",
        json={"name": "creatine monohydrate"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == str(supplement_id)
    assert body["status"] == "ready"
    assert body["ai_profile"] == {"summary": "ready"}
    assert body["ai_error"] is None
    assert dispatched_ids == []


def test_onboard_failed_supplement_retries_generation(client, monkeypatch):
    supplement_id = create_supplement("Lion's Mane")
    asyncio.run(set_ai_status(str(supplement_id), "failed", "Anthropic API key is not configured."))

    headers = auth_headers(client)
    dispatched_ids = []
    monkeypatch.setattr(supplements_route, "get_ai_unavailable_reason", lambda: None)
    monkeypatch.setattr(
        supplements_route.generate_ai_profile,
        "delay",
        lambda supplement_id: dispatched_ids.append(supplement_id),
    )

    response = client.post(
        "/api/v1/supplements/onboard",
        json={"name": "lion's mane"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == str(supplement_id)
    assert body["status"] == "generating"
    assert body["ai_error"] is None
    assert dispatched_ids == [str(supplement_id)]


def test_onboard_returns_failed_status_when_ai_is_unavailable(client, monkeypatch):
    headers = auth_headers(client)
    monkeypatch.setattr(
        supplements_route,
        "get_ai_unavailable_reason",
        lambda: "AI profile generation is unavailable until the Anthropic API key is configured.",
    )

    response = client.post(
        "/api/v1/supplements/onboard",
        json={"name": "Berberine"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "failed"
    assert body["ai_profile"] is None
    assert body["ai_error"] == "AI profile generation is unavailable until the Anthropic API key is configured."
