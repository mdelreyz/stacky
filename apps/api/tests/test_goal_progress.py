"""Integration tests for goal progress endpoint."""

import asyncio
from datetime import date, datetime, timezone

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.peptide import Peptide, PeptideCategory
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


def signup_with_user(client, email: str) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Goal",
            "last_name": "Tester",
            "email": email,
            "password": "Password123",
        },
    )
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def create_supplement(name: str, category=SupplementCategory.other, goals=None):
    async def _create():
        async with async_session_factory() as session:
            supplement = Supplement(name=name, category=category, goals=goals)
            session.add(supplement)
            await session.commit()
            await session.refresh(supplement)
            return supplement.id

    return asyncio.run(_create())


def create_peptide(name: str, category=PeptideCategory.other, goals=None):
    async def _create():
        async with async_session_factory() as session:
            peptide = Peptide(name=name, category=category, goals=goals)
            session.add(peptide)
            await session.commit()
            await session.refresh(peptide)
            return peptide.id

    return asyncio.run(_create())


def create_log(
    user_id: str,
    item_id: str,
    *,
    item_type: str,
    scheduled_at: datetime,
    taken_at: datetime | None = None,
    skipped: bool = False,
):
    async def _create():
        async with async_session_factory() as session:
            session.add(
                AdherenceLog(
                    user_id=user_id,
                    item_type=item_type,
                    item_id=item_id,
                    scheduled_at=scheduled_at,
                    taken_at=taken_at,
                    skipped=skipped,
                    skip_reason="Skipped" if skipped else None,
                )
            )
            await session.commit()

    asyncio.run(_create())


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


def test_goal_progress_averages_supplements_and_peptides(client):
    headers, user_id = signup_with_user(client, "goal-mixed@example.com")

    supplement_id = create_supplement(
        "Magnesium Glycinate",
        category=SupplementCategory.sleep_recovery,
        goals=["sleep"],
    )
    peptide_id = create_peptide("DSIP", goals=["sleep"])

    client.put(
        "/api/v1/users/me/preferences",
        json={"primary_goals": ["sleep"]},
        headers=headers,
    )

    supplement_response = client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": str(supplement_id),
            "dosage_amount": 400,
            "dosage_unit": "mg",
            "frequency": "daily",
            "take_window": "bedtime",
            "started_at": date.today().isoformat(),
        },
        headers=headers,
    )
    user_supplement_id = supplement_response.json()["id"]

    peptide_response = client.post(
        "/api/v1/users/me/peptides",
        json={
            "peptide_id": str(peptide_id),
            "dosage_amount": 100,
            "dosage_unit": "mcg",
            "frequency": "daily",
            "take_window": "bedtime",
            "with_food": False,
            "route": "subcutaneous",
            "started_at": date.today().isoformat(),
        },
        headers=headers,
    )
    user_peptide_id = peptide_response.json()["id"]

    create_log(
        user_id,
        user_supplement_id,
        item_type="supplement",
        scheduled_at=datetime.now(timezone.utc),
        taken_at=datetime.now(timezone.utc),
    )
    create_log(
        user_id,
        user_peptide_id,
        item_type="peptide",
        scheduled_at=datetime.now(timezone.utc),
        taken_at=datetime.now(timezone.utc),
    )
    create_log(
        user_id,
        user_peptide_id,
        item_type="peptide",
        scheduled_at=datetime.now(timezone.utc),
        skipped=True,
    )

    response = client.get("/api/v1/users/me/goal-progress", headers=headers)
    assert response.status_code == 200
    body = response.json()
    sleep_goal = body["goals"][0]
    assert sleep_goal["goal"] == "sleep"
    assert sleep_goal["item_count"] == 2
    assert sleep_goal["adherence_rate"] == 0.75

    supporting_items = {item["type"]: item for item in sleep_goal["supporting_items"]}
    assert supporting_items["supplement"]["name"] == "Magnesium Glycinate"
    assert supporting_items["supplement"]["adherence_rate"] == 1.0
    assert supporting_items["peptide"]["name"] == "DSIP"
    assert supporting_items["peptide"]["adherence_rate"] == 0.5
    assert supporting_items["peptide"]["taken_count"] == 1
    assert supporting_items["peptide"]["total_count"] == 2


def test_goal_progress_excludes_inactive_peptides(client):
    headers = signup(client)

    peptide_id = create_peptide("GHK-Cu", category=PeptideCategory.cosmetic, goals=["skin"])

    client.put(
        "/api/v1/users/me/preferences",
        json={"primary_goals": ["skin"]},
        headers=headers,
    )

    create_response = client.post(
        "/api/v1/users/me/peptides",
        json={
            "peptide_id": str(peptide_id),
            "dosage_amount": 100,
            "dosage_unit": "mcg",
            "frequency": "daily",
            "take_window": "morning_fasted",
            "with_food": False,
            "route": "topical",
            "started_at": date.today().isoformat(),
        },
        headers=headers,
    )
    user_peptide_id = create_response.json()["id"]

    deactivate_response = client.patch(
        f"/api/v1/users/me/peptides/{user_peptide_id}",
        json={"is_active": False},
        headers=headers,
    )
    assert deactivate_response.status_code == 200

    response = client.get("/api/v1/users/me/goal-progress", headers=headers)
    assert response.status_code == 200
    body = response.json()
    skin_goal = body["goals"][0]
    assert skin_goal["goal"] == "skin"
    assert skin_goal["item_count"] == 0
    assert skin_goal["supporting_items"] == []
    assert skin_goal["adherence_rate"] is None


def test_goal_progress_requires_auth(client):
    response = client.get("/api/v1/users/me/goal-progress")
    assert response.status_code in (401, 403, 422)
