import asyncio

from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory


def signup(client) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Wizard",
            "last_name": "Test",
            "email": "wizard@example.com",
            "password": "Password123",
        },
    )
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def seed_catalog():
    async def _seed():
        async with async_session_factory() as session:
            items = [
                Supplement(
                    name="Omega-3 Fish Oil",
                    category=SupplementCategory.cardiovascular,
                    form="softgel",
                    goals=["longevity"],
                    is_verified=True,
                ),
                Supplement(
                    name="Vitamin D3",
                    category=SupplementCategory.immune_antimicrobial,
                    form="capsule",
                    goals=["longevity", "immunity"],
                    is_verified=True,
                ),
                Supplement(
                    name="Magnesium Glycinate",
                    category=SupplementCategory.sleep_recovery,
                    form="capsule",
                    goals=["sleep"],
                    is_verified=True,
                ),
            ]
            session.add_all(items)
            await session.commit()

    asyncio.run(_seed())


def test_wizard_first_turn_returns_question(client):
    """First wizard turn should return an assistant question, not be complete."""
    headers, _ = signup(client)
    seed_catalog()

    response = client.post(
        "/api/v1/users/me/preferences/wizard",
        json={"message": "Hi, I want to build a protocol"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["is_complete"] is False
    assert body["assistant_message"]  # Non-empty
    assert len(body["conversation"]) == 2  # user + assistant
    assert body["conversation"][0]["role"] == "user"
    assert body["conversation"][1]["role"] == "assistant"
    assert body["recommended_items"] is None


def test_wizard_multi_turn_reaches_completion(client):
    """Walk through all static fallback questions until the wizard completes."""
    headers, _ = signup(client)
    seed_catalog()

    conversation = []
    user_answers = [
        "I want to focus on longevity and sleep",
        "5 pills per day is fine",
        "No allergies",
        "Just general optimization, nothing specific",
    ]

    for answer in user_answers:
        response = client.post(
            "/api/v1/users/me/preferences/wizard",
            json={"message": answer, "conversation": conversation},
            headers=headers,
        )
        assert response.status_code == 200
        body = response.json()
        conversation = body["conversation"]

    # After 4 turns, the static fallback should have completed
    assert body["is_complete"] is True
    assert body["recommended_items"] is not None
    assert len(body["recommended_items"]) > 0
    assert body["protocol_name"] is not None
    assert body["summary"] is not None
    assert body["extracted_preferences"] is not None


def test_wizard_conversation_history_grows(client):
    """Each turn should add 2 entries to the conversation (user + assistant)."""
    headers, _ = signup(client)
    seed_catalog()

    # Turn 1
    r1 = client.post(
        "/api/v1/users/me/preferences/wizard",
        json={"message": "Hello"},
        headers=headers,
    )
    conv = r1.json()["conversation"]
    assert len(conv) == 2

    # Turn 2
    r2 = client.post(
        "/api/v1/users/me/preferences/wizard",
        json={"message": "Longevity and energy", "conversation": conv},
        headers=headers,
    )
    conv = r2.json()["conversation"]
    assert len(conv) == 4

    # Turn 3
    r3 = client.post(
        "/api/v1/users/me/preferences/wizard",
        json={"message": "No limit", "conversation": conv},
        headers=headers,
    )
    conv = r3.json()["conversation"]
    assert len(conv) == 6


def test_wizard_rejects_empty_message(client):
    headers, _ = signup(client)

    response = client.post(
        "/api/v1/users/me/preferences/wizard",
        json={"message": "", "conversation": []},
        headers=headers,
    )

    assert response.status_code == 422


def test_wizard_completed_response_has_valid_items(client):
    """When wizard completes, each recommended item should have required fields."""
    headers, _ = signup(client)
    seed_catalog()

    conversation = []
    for answer in ["longevity", "5", "none", "general"]:
        r = client.post(
            "/api/v1/users/me/preferences/wizard",
            json={"message": answer, "conversation": conversation},
            headers=headers,
        )
        conversation = r.json()["conversation"]

    body = r.json()
    assert body["is_complete"] is True
    for item in body["recommended_items"]:
        assert "name" in item
        assert "item_type" in item
        assert "reason" in item
