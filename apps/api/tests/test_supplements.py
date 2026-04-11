import asyncio

from sqlalchemy import select

from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory
from app.models.user import User
from app.routes import supplements as supplements_route
from app.services.ai_onboarding import set_ai_status


def auth_headers(client, email: str = "test@example.com"):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": email,
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def user_id_for_email(email: str):
    async def _get():
        async with async_session_factory() as session:
            result = await session.execute(select(User).where(User.email == email))
            return result.scalar_one().id

    return asyncio.run(_get())


def create_supplement(name: str, ai_profile=None, created_by_user_id=None):
    async def _create():
        async with async_session_factory() as session:
            supplement = Supplement(
                name=name,
                category=SupplementCategory.other,
                ai_profile=ai_profile,
                created_by_user_id=created_by_user_id,
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
    assert detail.json()["source"] == "user_created"


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


def test_list_supplements_includes_catalog_and_current_users_custom_only(client):
    owner_headers = auth_headers(client, "owner@example.com")
    auth_headers(client, "other@example.com")
    owner_id = user_id_for_email("owner@example.com")
    other_id = user_id_for_email("other@example.com")

    ready_profile = {"summary": "ready"}
    create_supplement("Creatine Monohydrate", ai_profile=ready_profile)
    create_supplement("My Private Blend", ai_profile=ready_profile, created_by_user_id=owner_id)
    create_supplement("Someone Else Blend", ai_profile=ready_profile, created_by_user_id=other_id)

    response = client.get("/api/v1/supplements", headers=owner_headers)

    assert response.status_code == 200
    items = {item["name"]: item for item in response.json()["items"]}
    assert "Creatine Monohydrate" in items
    assert items["Creatine Monohydrate"]["source"] == "catalog"
    assert "My Private Blend" in items
    assert items["My Private Blend"]["source"] == "user_created"
    assert "Someone Else Blend" not in items


def test_delete_user_created_failed_supplement_removes_zombie_entry(client):
    headers = auth_headers(client, "owner@example.com")
    owner_id = user_id_for_email("owner@example.com")
    supplement_id = create_supplement("Custom Failed Entry", created_by_user_id=owner_id)
    asyncio.run(set_ai_status(str(supplement_id), "failed", "Generation failed."))

    response = client.delete(f"/api/v1/supplements/{supplement_id}", headers=headers)

    assert response.status_code == 204
    detail = client.get(f"/api/v1/supplements/{supplement_id}", headers=headers)
    assert detail.status_code == 404


def test_delete_catalog_supplement_is_not_allowed(client):
    headers = auth_headers(client)
    supplement_id = create_supplement("Catalog Entry")

    response = client.delete(f"/api/v1/supplements/{supplement_id}", headers=headers)

    assert response.status_code == 404


def test_delete_user_created_supplement_requires_removal_from_protocol(client):
    headers = auth_headers(client, "owner@example.com")
    owner_id = user_id_for_email("owner@example.com")
    supplement_id = create_supplement("Attached Custom", created_by_user_id=owner_id)

    add_response = client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": str(supplement_id),
            "dosage_amount": 1,
            "dosage_unit": "capsule",
            "frequency": "daily",
            "take_window": "morning_with_food",
            "with_food": True,
            "started_at": "2026-04-10",
        },
        headers=headers,
    )
    assert add_response.status_code == 201

    response = client.delete(f"/api/v1/supplements/{supplement_id}", headers=headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "Remove this supplement from your protocol before deleting it."


def test_onboard_runs_in_process_when_celery_dispatch_is_disabled(client, monkeypatch):
    headers = auth_headers(client)
    executed_ids = []

    monkeypatch.setattr(supplements_route, "get_ai_unavailable_reason", lambda: None)
    monkeypatch.setattr(supplements_route, "should_dispatch_ai_tasks_with_celery", lambda: False)
    monkeypatch.setattr(
        supplements_route,
        "run_ai_onboarding_job_sync",
        lambda supplement_id: executed_ids.append(supplement_id),
    )

    response = client.post(
        "/api/v1/supplements/onboard",
        json={"name": "Rhodiola Rosea"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "generating"
    assert executed_ids == [body["id"]]
