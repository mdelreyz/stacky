"""Integration tests for health journal endpoints."""


def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Journal",
            "last_name": "Tester",
            "email": "journal@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_journal_entry(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/users/me/journal",
        json={
            "entry_date": "2026-04-11",
            "energy_level": 7,
            "mood_level": 8,
            "sleep_quality": 6,
            "stress_level": 4,
            "symptoms": ["Headache", "Fatigue"],
            "notes": "Felt good overall, slight headache in the afternoon.",
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["entry_date"] == "2026-04-11"
    assert body["energy_level"] == 7
    assert body["mood_level"] == 8
    assert body["sleep_quality"] == 6
    assert body["stress_level"] == 4
    assert body["symptoms"] == ["Headache", "Fatigue"]
    assert "id" in body


def test_upsert_same_date_updates(client):
    headers = signup(client)

    # Create entry
    response1 = client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-10", "energy_level": 5},
        headers=headers,
    )
    assert response1.status_code == 201
    entry_id = response1.json()["id"]

    # Upsert same date — should update, not create new
    response2 = client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-10", "energy_level": 8, "mood_level": 9},
        headers=headers,
    )
    assert response2.status_code == 201
    body = response2.json()
    assert body["id"] == entry_id
    assert body["energy_level"] == 8
    assert body["mood_level"] == 9


def test_get_entry_by_date(client):
    headers = signup(client)

    client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-09", "energy_level": 6, "notes": "Testing"},
        headers=headers,
    )

    response = client.get("/api/v1/users/me/journal/date/2026-04-09", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["entry_date"] == "2026-04-09"
    assert body["energy_level"] == 6
    assert body["notes"] == "Testing"


def test_get_entry_by_date_not_found(client):
    headers = signup(client)

    response = client.get("/api/v1/users/me/journal/date/2020-01-01", headers=headers)
    assert response.status_code == 404


def test_get_entry_by_id(client):
    headers = signup(client)

    create_resp = client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-08", "mood_level": 7},
        headers=headers,
    )
    entry_id = create_resp.json()["id"]

    response = client.get(f"/api/v1/users/me/journal/{entry_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == entry_id


def test_list_entries(client):
    headers = signup(client)

    for day in range(1, 6):
        client.post(
            "/api/v1/users/me/journal",
            json={"entry_date": f"2026-04-{day:02d}", "energy_level": day},
            headers=headers,
        )

    response = client.get("/api/v1/users/me/journal", headers=headers)
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) == 5
    # Should be ordered by date descending
    assert entries[0]["entry_date"] >= entries[-1]["entry_date"]


def test_list_entries_with_date_range(client):
    headers = signup(client)

    for day in range(1, 11):
        client.post(
            "/api/v1/users/me/journal",
            json={"entry_date": f"2026-04-{day:02d}", "energy_level": day},
            headers=headers,
        )

    response = client.get(
        "/api/v1/users/me/journal?start_date=2026-04-03&end_date=2026-04-07",
        headers=headers,
    )
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) == 5


def test_patch_entry(client):
    headers = signup(client)

    create_resp = client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-07", "energy_level": 5, "mood_level": 6},
        headers=headers,
    )
    entry_id = create_resp.json()["id"]

    response = client.patch(
        f"/api/v1/users/me/journal/{entry_id}",
        json={"energy_level": 9, "symptoms": ["Brain fog"]},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["energy_level"] == 9
    assert body["mood_level"] == 6  # unchanged
    assert body["symptoms"] == ["Brain fog"]


def test_delete_entry(client):
    headers = signup(client)

    create_resp = client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-06", "energy_level": 4},
        headers=headers,
    )
    entry_id = create_resp.json()["id"]

    response = client.delete(f"/api/v1/users/me/journal/{entry_id}", headers=headers)
    assert response.status_code == 204

    # Verify gone
    response = client.get(f"/api/v1/users/me/journal/{entry_id}", headers=headers)
    assert response.status_code == 404


def test_summary(client):
    headers = signup(client)

    # Create a few entries
    for day, energy, mood, sleep in [(1, 7, 8, 6), (2, 8, 7, 7), (3, 6, 9, 8)]:
        client.post(
            "/api/v1/users/me/journal",
            json={
                "entry_date": f"2026-04-{day:02d}",
                "energy_level": energy,
                "mood_level": mood,
                "sleep_quality": sleep,
                "symptoms": ["Fatigue"] if day == 1 else [],
            },
            headers=headers,
        )

    response = client.get(
        "/api/v1/users/me/journal/summary?start_date=2026-04-01&end_date=2026-04-30",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["entry_count"] == 3
    assert body["avg_energy"] == 7.0
    assert body["avg_mood"] == 8.0
    assert body["avg_sleep"] == 7.0
    assert "Fatigue" in body["symptom_frequency"]
    assert len(body["trend_energy"]) == 3


def test_summary_empty(client):
    headers = signup(client)

    response = client.get("/api/v1/users/me/journal/summary", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["entry_count"] == 0
    assert body["avg_energy"] is None


def test_journal_requires_auth(client):
    response = client.get("/api/v1/users/me/journal")
    assert response.status_code in (401, 403, 422)

    response = client.post("/api/v1/users/me/journal", json={"entry_date": "2026-04-11"})
    assert response.status_code in (401, 403, 422)


def test_validation_rejects_out_of_range(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-11", "energy_level": 11},
        headers=headers,
    )
    assert response.status_code == 422

    response = client.post(
        "/api/v1/users/me/journal",
        json={"entry_date": "2026-04-11", "mood_level": 0},
        headers=headers,
    )
    assert response.status_code == 422
