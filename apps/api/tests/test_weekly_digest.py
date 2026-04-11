"""Integration tests for weekly digest endpoint."""

import asyncio
from datetime import date, timedelta

from app.models.adherence import AdherenceLog
from app.models.health_journal import HealthJournalEntry


def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Digest",
            "last_name": "Tester",
            "email": "digest@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_weekly_digest_empty(client):
    headers = signup(client)

    response = client.get("/api/v1/users/me/weekly-digest", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["adherence"]["total_logged"] == 0
    assert body["adherence"]["completion_rate"] == 0.0
    assert body["journal"]["entry_count"] == 0
    assert body["exercise"]["session_count"] == 0
    assert len(body["daily_rates"] if "daily_rates" in body else body["adherence"]["daily_rates"]) == 7


def test_weekly_digest_with_journal_entries(client):
    headers = signup(client)

    # Create journal entries for the week
    today = date.today()
    for i in range(5):
        d = (today - timedelta(days=i)).isoformat()
        client.post(
            "/api/v1/users/me/journal",
            json={
                "entry_date": d,
                "energy_level": 7,
                "mood_level": 8,
                "sleep_quality": 6,
                "symptoms": ["Fatigue"] if i == 0 else [],
            },
            headers=headers,
        )

    response = client.get("/api/v1/users/me/weekly-digest", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["journal"]["entry_count"] == 5
    assert body["journal"]["avg_energy"] == 7.0
    assert body["journal"]["avg_mood"] == 8.0
    assert body["journal"]["avg_sleep"] == 6.0
    assert "Fatigue" in body["journal"]["symptom_frequency"]


def test_weekly_digest_with_custom_week_end(client):
    headers = signup(client)

    # Create entry in past
    client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-03-15", "energy_level": 5},
        headers=headers,
    )

    response = client.get(
        "/api/v1/users/me/weekly-digest?week_end=2026-03-15",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["week_end"] == "2026-03-15"
    assert body["week_start"] == "2026-03-09"
    assert body["journal"]["entry_count"] == 1


def test_weekly_digest_highlights_journaling(client):
    headers = signup(client)

    today = date.today()
    for i in range(6):
        d = (today - timedelta(days=i)).isoformat()
        client.post(
            "/api/v1/users/me/journal",
            json={"entry_date": d, "energy_level": 7},
            headers=headers,
        )

    response = client.get("/api/v1/users/me/weekly-digest", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert any("journaling" in h.lower() for h in body["highlights"])


def test_weekly_digest_requires_auth(client):
    response = client.get("/api/v1/users/me/weekly-digest")
    assert response.status_code in (401, 403, 422)
