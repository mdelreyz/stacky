"""Integration tests for weekly digest endpoint."""

from datetime import date, timedelta


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
    assert body["comparison"]["adherence_completion_rate"]["delta"] == 0.0
    assert body["comparison"]["journal_avg_energy"]["delta"] is None
    assert body["monthly_comparison"]["adherence_completion_rate"]["delta"] == 0.0
    assert body["monthly_comparison"]["journal_avg_energy"]["delta"] is None


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


def test_weekly_digest_includes_previous_week_comparison(client):
    headers = signup(client)

    current_week_end = date(2026, 4, 11)

    for entry_date, energy in [
        ("2026-04-10", 8),
        ("2026-04-11", 6),
        ("2026-04-04", 5),
        ("2026-03-08", 5),
    ]:
        client.post(
            "/api/v1/users/me/journal",
            json={"entry_date": entry_date, "energy_level": energy},
            headers=headers,
        )

    response = client.get(
        f"/api/v1/users/me/weekly-digest?week_end={current_week_end.isoformat()}",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    comparison = body["comparison"]
    assert comparison["previous_week_start"] == "2026-03-29"
    assert comparison["previous_week_end"] == "2026-04-04"
    assert comparison["journal_entry_count"] == {
        "current": 2,
        "previous": 1,
        "delta": 1,
    }
    assert comparison["journal_avg_energy"] == {
        "current": 7.0,
        "previous": 5.0,
        "delta": 2.0,
    }
    assert comparison["adherence_completion_rate"] == {
        "current": 0.0,
        "previous": 0.0,
        "delta": 0.0,
    }
    monthly_comparison = body["monthly_comparison"]
    assert monthly_comparison["current_month_start"] == "2026-04-01"
    assert monthly_comparison["current_month_end"] == "2026-04-11"
    assert monthly_comparison["previous_month_start"] == "2026-03-01"
    assert monthly_comparison["previous_month_end"] == "2026-03-11"
    assert monthly_comparison["journal_entry_count"] == {
        "current": 3,
        "previous": 1,
        "delta": 2,
    }
    assert monthly_comparison["journal_avg_energy"] == {
        "current": 6.3,
        "previous": 5.0,
        "delta": 1.3,
    }


def test_weekly_digest_monthly_comparison_excludes_later_previous_month_entries(client):
    headers = signup(client)

    for entry_date, energy in [
        ("2026-04-02", 7),
        ("2026-03-10", 5),
        ("2026-03-15", 9),
    ]:
        client.post(
            "/api/v1/users/me/journal",
            json={"entry_date": entry_date, "energy_level": energy},
            headers=headers,
        )

    response = client.get("/api/v1/users/me/weekly-digest?week_end=2026-04-11", headers=headers)

    assert response.status_code == 200
    monthly_comparison = response.json()["monthly_comparison"]
    assert monthly_comparison["previous_month_end"] == "2026-03-11"
    assert monthly_comparison["journal_entry_count"] == {
        "current": 1,
        "previous": 1,
        "delta": 0,
    }
    assert monthly_comparison["journal_avg_energy"] == {
        "current": 7.0,
        "previous": 5.0,
        "delta": 2.0,
    }


def test_weekly_digest_monthly_comparison_caps_to_shorter_previous_month(client):
    headers = signup(client)

    for entry_date, energy in [
        ("2026-03-31", 7),
        ("2026-02-28", 6),
    ]:
        client.post(
            "/api/v1/users/me/journal",
            json={"entry_date": entry_date, "energy_level": energy},
            headers=headers,
        )

    response = client.get("/api/v1/users/me/weekly-digest?week_end=2026-03-31", headers=headers)

    assert response.status_code == 200
    monthly_comparison = response.json()["monthly_comparison"]
    assert monthly_comparison["current_month_start"] == "2026-03-01"
    assert monthly_comparison["current_month_end"] == "2026-03-31"
    assert monthly_comparison["previous_month_start"] == "2026-02-01"
    assert monthly_comparison["previous_month_end"] == "2026-02-28"
    assert monthly_comparison["journal_entry_count"] == {
        "current": 1,
        "previous": 1,
        "delta": 0,
    }


def test_weekly_digest_requires_auth(client):
    response = client.get("/api/v1/users/me/weekly-digest")
    assert response.status_code in (401, 403, 422)
