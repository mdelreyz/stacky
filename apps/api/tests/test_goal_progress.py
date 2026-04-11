"""Integration tests for goal progress endpoint."""

import asyncio
from datetime import date

from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory


def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Goal",
            "last_name": "Tester",
            "email": "goal@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_supplement(name: str, category=SupplementCategory.other, goals=None):
    async def _create():
        async with async_session_factory() as session:
            supplement = Supplement(name=name, category=category, goals=goals)
            session.add(supplement)
            await session.commit()
            await session.refresh(supplement)
            return supplement.id

    return asyncio.run(_create())


def test_goal_progress_no_preferences(client):
    headers = signup(client)

    response = client.get("/api/v1/users/me/goal-progress", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["has_preferences"] is False
    assert body["goals"] == []


def test_goal_progress_with_goals_but_no_items(client):
    headers = signup(client)

    # Set preferences with goals
    client.put(
        "/api/v1/users/me/preferences",
        json={"primary_goals": ["sleep", "energy"]},
        headers=headers,
    )

    response = client.get("/api/v1/users/me/goal-progress", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["has_preferences"] is True
    assert len(body["goals"]) == 2
    assert body["goals"][0]["goal"] == "sleep"
    assert body["goals"][0]["item_count"] == 0
    assert body["goals"][1]["goal"] == "energy"


def test_goal_progress_with_supporting_supplements(client):
    headers = signup(client)

    # Create a supplement in the sleep category
    supp_id = create_supplement(
        "Magnesium Glycinate",
        category=SupplementCategory.sleep_recovery,
        goals=["sleep"],
    )

    # Set goals
    client.put(
        "/api/v1/users/me/preferences",
        json={"primary_goals": ["sleep"]},
        headers=headers,
    )

    # Add supplement to user stack
    client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": str(supp_id),
            "dosage_amount": 400,
            "dosage_unit": "mg",
            "frequency": "daily",
            "take_window": "bedtime",
            "started_at": date.today().isoformat(),
        },
        headers=headers,
    )

    response = client.get("/api/v1/users/me/goal-progress", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["goals"]) == 1
    sleep_goal = body["goals"][0]
    assert sleep_goal["goal"] == "sleep"
    assert sleep_goal["item_count"] == 1
    assert sleep_goal["supporting_items"][0]["name"] == "Magnesium Glycinate"
    assert sleep_goal["journal_metric"] == "sleep_quality"


def test_goal_progress_with_journal_data(client):
    headers = signup(client)

    # Set goals
    client.put(
        "/api/v1/users/me/preferences",
        json={"primary_goals": ["energy"]},
        headers=headers,
    )

    # Create journal entries
    today = date.today()
    for i in range(3):
        d = today.isoformat() if i == 0 else (date(today.year, today.month, max(1, today.day - i))).isoformat()
        client.post(
            "/api/v1/users/me/journal",
            json={"entry_date": d, "energy_level": 7 + i},
            headers=headers,
        )

    response = client.get("/api/v1/users/me/goal-progress", headers=headers)
    assert response.status_code == 200
    body = response.json()
    energy_goal = body["goals"][0]
    assert energy_goal["goal"] == "energy"
    assert energy_goal["journal_metric"] == "energy_level"
    assert energy_goal["journal_avg"] is not None
    assert len(energy_goal["journal_trend"]) > 0


def test_goal_progress_custom_days(client):
    headers = signup(client)

    client.put(
        "/api/v1/users/me/preferences",
        json={"primary_goals": ["longevity"]},
        headers=headers,
    )

    response = client.get("/api/v1/users/me/goal-progress?days=30", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["period_days"] == 30


def test_goal_progress_requires_auth(client):
    response = client.get("/api/v1/users/me/goal-progress")
    assert response.status_code in (401, 403, 422)
