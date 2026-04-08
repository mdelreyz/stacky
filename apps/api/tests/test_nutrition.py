def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Nutri",
            "last_name": "Planner",
            "email": "nutrition@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_list_update_and_remove_nutrition_plan(client):
    headers = signup(client)

    create_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "macro_profile",
            "name": "Training Cut",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Primary Phase",
                    "duration_days": 3,
                    "macro_profile": {"carbs": "low", "protein": "high", "fat": "medium"},
                    "pattern": None,
                    "restrictions": ["No late-night snacks"],
                    "notes": "Base week",
                }
            ],
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["name"] == "Training Cut"
    assert created["current_phase_idx"] == 0

    list_response = client.get("/api/v1/users/me/nutrition", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()["items"][0]["id"] == created["id"]

    update_response = client.patch(
        f"/api/v1/users/me/nutrition/{created['id']}",
        headers=headers,
        json={
            "cycle_type": "named_diet",
            "name": "Low FODMAP Reset",
            "phases": [
                {
                    "name": "Reset",
                    "duration_days": 7,
                    "macro_profile": None,
                    "pattern": "Low FODMAP",
                    "restrictions": ["No onions", "No garlic"],
                    "notes": "Track symptoms",
                }
            ],
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["cycle_type"] == "named_diet"
    assert updated["phases"][0]["pattern"] == "Low FODMAP"

    remove_response = client.delete(f"/api/v1/users/me/nutrition/{created['id']}", headers=headers)
    assert remove_response.status_code == 204

    list_after_remove = client.get("/api/v1/users/me/nutrition", headers=headers)
    assert list_after_remove.status_code == 200
    assert list_after_remove.json()["items"] == []


def test_rejects_second_active_nutrition_plan(client):
    headers = signup(client)

    first_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "named_diet",
            "name": "Atkins Block",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Core",
                    "duration_days": 7,
                    "macro_profile": None,
                    "pattern": "Atkins",
                    "restrictions": [],
                    "notes": None,
                }
            ],
        },
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "custom",
            "name": "Elimination Trial",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Trial",
                    "duration_days": 5,
                    "macro_profile": None,
                    "pattern": "Specific limit dish plan",
                    "restrictions": ["No dairy"],
                    "notes": "Observe response",
                }
            ],
        },
    )

    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "A nutrition plan is already active"
