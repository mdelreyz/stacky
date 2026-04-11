"""Integration tests for protocol templates — listing, detail, and adoption."""

import asyncio
import uuid

from app.database import async_session_factory
from app.models.protocol_template import ProtocolTemplate
from app.models.supplement import Supplement
from sqlalchemy import select, func


def _run(coro):
    """Run an async function in the test context."""
    return asyncio.run(coro)


def _seed_template():
    """Insert a test template directly into the DB."""
    template_id = uuid.uuid4()

    async def _do():
        async with async_session_factory() as session:
            t = ProtocolTemplate(
                id=template_id,
                name="Test Longevity Stack",
                description="A test template for integration testing",
                category="longevity",
                difficulty="beginner",
                icon="heartbeat",
                is_featured=True,
                sort_order=1,
                adoption_count=0,
                items=[
                    {
                        "type": "supplement",
                        "catalog_name": "Vitamin D3",
                        "dosage": "5000 IU",
                        "take_window": "morning_with_food",
                        "frequency": "daily",
                    },
                    {
                        "type": "supplement",
                        "catalog_name": "Nonexistent Supplement XYZ",
                        "dosage": "100 mg",
                        "take_window": "morning_fasted",
                        "frequency": "daily",
                    },
                ],
                tags=["longevity", "test"],
            )
            session.add(t)
            await session.commit()

    _run(_do())
    return template_id


def _seed_supplement():
    """Ensure a Vitamin D3 exists in the catalog."""

    async def _do():
        async with async_session_factory() as session:
            existing = await session.execute(
                select(func.count()).select_from(Supplement).where(
                    func.lower(Supplement.name) == "vitamin d3"
                )
            )
            if existing.scalar() > 0:
                return
            s = Supplement(
                name="Vitamin D3",
                category="healthy_aging",
            )
            session.add(s)
            await session.commit()

    _run(_do())


def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Template",
            "last_name": "Tester",
            "email": "template@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_templates(client):
    _seed_template()

    response = client.get("/api/v1/protocol-templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 1
    names = [t["name"] for t in templates]
    assert "Test Longevity Stack" in names


def test_list_templates_filter_by_category(client):
    _seed_template()

    response = client.get("/api/v1/protocol-templates?category=longevity")
    assert response.status_code == 200
    templates = response.json()
    assert all(t["category"] == "longevity" for t in templates)


def test_list_templates_featured_only(client):
    _seed_template()

    response = client.get("/api/v1/protocol-templates?featured_only=true")
    assert response.status_code == 200
    templates = response.json()
    assert all(t["is_featured"] is True for t in templates)


def test_get_template_detail(client):
    template_id = _seed_template()

    response = client.get(f"/api/v1/protocol-templates/{template_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Test Longevity Stack"
    assert body["items"] is not None
    assert len(body["items"]) == 2
    assert body["items"][0]["catalog_name"] == "Vitamin D3"


def test_get_template_not_found(client):
    fake_id = uuid.uuid4()
    response = client.get(f"/api/v1/protocol-templates/{fake_id}")
    assert response.status_code == 404


def test_adopt_template(client):
    _seed_supplement()
    template_id = _seed_template()
    headers = signup(client)

    response = client.post(
        f"/api/v1/protocol-templates/{template_id}/adopt",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["protocol_name"] == "Test Longevity Stack"
    assert body["items_created"] >= 1
    assert "Protocol" in body["message"]


def test_adopt_template_not_found(client):
    headers = signup(client)
    fake_id = uuid.uuid4()

    response = client.post(
        f"/api/v1/protocol-templates/{fake_id}/adopt",
        headers=headers,
    )
    assert response.status_code == 404


def test_adopt_template_creates_protocol(client):
    _seed_supplement()
    template_id = _seed_template()
    headers = signup(client)

    adopt_response = client.post(
        f"/api/v1/protocol-templates/{template_id}/adopt",
        headers=headers,
    )
    protocol_id = adopt_response.json()["protocol_id"]
    assert protocol_id is not None

    protocol_response = client.get(
        f"/api/v1/users/me/protocols/{protocol_id}",
        headers=headers,
    )
    assert protocol_response.status_code == 200
    protocol = protocol_response.json()
    assert protocol["name"] == "Test Longevity Stack"
    assert len(protocol["items"]) >= 1


def test_adopt_template_idempotent_user_items(client):
    _seed_supplement()
    template_id = _seed_template()
    headers = signup(client)

    first = client.post(f"/api/v1/protocol-templates/{template_id}/adopt", headers=headers)
    second = client.post(f"/api/v1/protocol-templates/{template_id}/adopt", headers=headers)

    assert second.json()["items_existing"] >= first.json()["items_created"]
