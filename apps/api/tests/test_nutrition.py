from datetime import date

from app.routes import nutrition as nutrition_route


def signup(client, email: str = "nutrition@example.com") -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Nutri",
            "last_name": "Planner",
            "email": email,
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


def test_get_nutrition_cycle_syncs_current_phase_from_reference_date(client, monkeypatch):
    monkeypatch.setattr(nutrition_route, "resolve_user_date", lambda _target, _tz: (date(2026, 4, 12), "UTC"))
    headers = signup(client)

    create_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "macro_profile",
            "name": "Performance Rotation",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Low Day",
                    "duration_days": 3,
                    "macro_profile": {"carbs": "low", "protein": "high", "fat": "medium"},
                    "pattern": None,
                    "restrictions": [],
                    "notes": None,
                },
                {
                    "name": "Refuel",
                    "duration_days": 5,
                    "macro_profile": {"carbs": "high", "protein": "medium", "fat": "low"},
                    "pattern": None,
                    "restrictions": [],
                    "notes": "Lift days",
                },
            ],
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["current_phase_idx"] == 1
    assert created["next_transition"] == "2026-04-16"

    get_response = client.get(f"/api/v1/users/me/nutrition/{created['id']}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["current_phase_idx"] == 1
    assert get_response.json()["phases"][1]["name"] == "Refuel"


def test_create_future_nutrition_cycle_keeps_first_phase_until_start(client, monkeypatch):
    monkeypatch.setattr(nutrition_route, "resolve_user_date", lambda _target, _tz: (date(2026, 4, 12), "UTC"))
    headers = signup(client, "future-nutrition@example.com")

    response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "custom",
            "name": "Travel Prep",
            "phase_started_at": "2026-04-15",
            "phases": [
                {
                    "name": "Prep",
                    "duration_days": 3,
                    "macro_profile": None,
                    "pattern": "Travel prep",
                    "restrictions": ["No alcohol"],
                    "notes": None,
                },
                {
                    "name": "Trip",
                    "duration_days": 4,
                    "macro_profile": None,
                    "pattern": "Travel week",
                    "restrictions": [],
                    "notes": None,
                },
            ],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["current_phase_idx"] == 0
    assert body["next_transition"] == "2026-04-18"


def test_update_nutrition_cycle_resyncs_when_phase_timing_changes(client, monkeypatch):
    monkeypatch.setattr(nutrition_route, "resolve_user_date", lambda _target, _tz: (date(2026, 4, 12), "UTC"))
    headers = signup(client, "update-nutrition@example.com")

    create_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "macro_profile",
            "name": "Base Rotation",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Base",
                    "duration_days": 7,
                    "macro_profile": {"carbs": "medium", "protein": "high", "fat": "medium"},
                    "pattern": None,
                    "restrictions": [],
                    "notes": None,
                }
            ],
        },
    )
    cycle_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/users/me/nutrition/{cycle_id}",
        headers=headers,
        json={
            "phase_started_at": "2026-04-10",
            "phases": [
                {
                    "name": "Primer",
                    "duration_days": 1,
                    "macro_profile": None,
                    "pattern": "Primer",
                    "restrictions": [],
                    "notes": None,
                },
                {
                    "name": "Main",
                    "duration_days": 3,
                    "macro_profile": None,
                    "pattern": "Main block",
                    "restrictions": [],
                    "notes": "Main run",
                },
            ],
        },
    )

    assert update_response.status_code == 200
    body = update_response.json()
    assert body["current_phase_idx"] == 1
    assert body["next_transition"] == "2026-04-14"
    assert body["phases"][1]["name"] == "Main"


def test_reactivating_inactive_nutrition_cycle_requires_no_other_active_plan(client):
    headers = signup(client)

    first_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "named_diet",
            "name": "Reset Block",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Reset",
                    "duration_days": 7,
                    "macro_profile": None,
                    "pattern": "Reset",
                    "restrictions": ["No alcohol"],
                    "notes": None,
                }
            ],
        },
    )
    assert first_response.status_code == 201
    first_cycle_id = first_response.json()["id"]

    deactivate_response = client.patch(
        f"/api/v1/users/me/nutrition/{first_cycle_id}",
        headers=headers,
        json={"is_active": False},
    )
    assert deactivate_response.status_code == 200
    assert deactivate_response.json()["is_active"] is False

    second_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "custom",
            "name": "Maintenance Block",
            "phase_started_at": "2026-04-10",
            "phases": [
                {
                    "name": "Maintenance",
                    "duration_days": 5,
                    "macro_profile": None,
                    "pattern": "Maintenance",
                    "restrictions": [],
                    "notes": "Steady state",
                }
            ],
        },
    )
    assert second_response.status_code == 201

    reactivate_response = client.patch(
        f"/api/v1/users/me/nutrition/{first_cycle_id}",
        headers=headers,
        json={"is_active": True},
    )
    assert reactivate_response.status_code == 409
    assert reactivate_response.json()["detail"] == "A nutrition plan is already active"


def test_reactivating_inactive_nutrition_cycle_succeeds_without_conflict(client):
    headers = signup(client, "reactivate-nutrition@example.com")

    create_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "named_diet",
            "name": "Cycle Reset",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Reset",
                    "duration_days": 7,
                    "macro_profile": None,
                    "pattern": "Reset",
                    "restrictions": [],
                    "notes": None,
                }
            ],
        },
    )
    cycle_id = create_response.json()["id"]

    deactivate_response = client.patch(
        f"/api/v1/users/me/nutrition/{cycle_id}",
        headers=headers,
        json={"is_active": False},
    )
    assert deactivate_response.status_code == 200

    reactivate_response = client.patch(
        f"/api/v1/users/me/nutrition/{cycle_id}",
        headers=headers,
        json={"is_active": True},
    )
    assert reactivate_response.status_code == 200
    assert reactivate_response.json()["is_active"] is True


def test_list_nutrition_includes_inactive_when_requested(client):
    headers = signup(client)

    create_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "named_diet",
            "name": "Maintenance",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Base",
                    "duration_days": 7,
                    "macro_profile": None,
                    "pattern": "Maintenance",
                    "restrictions": [],
                    "notes": None,
                }
            ],
        },
    )
    cycle_id = create_response.json()["id"]

    deactivate_response = client.patch(
        f"/api/v1/users/me/nutrition/{cycle_id}",
        headers=headers,
        json={"is_active": False},
    )
    assert deactivate_response.status_code == 200

    active_only_response = client.get("/api/v1/users/me/nutrition", headers=headers)
    assert active_only_response.status_code == 200
    assert active_only_response.json()["items"] == []

    all_items_response = client.get("/api/v1/users/me/nutrition?active_only=false", headers=headers)
    assert all_items_response.status_code == 200
    assert [item["id"] for item in all_items_response.json()["items"]] == [cycle_id]


def test_nutrition_routes_are_scoped_to_current_user(client):
    owner_headers = signup(client, "owner-nutrition@example.com")
    other_headers = signup(client, "other-nutrition@example.com")

    create_response = client.post(
        "/api/v1/users/me/nutrition",
        headers=owner_headers,
        json={
            "cycle_type": "custom",
            "name": "Owner Plan",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Owner Phase",
                    "duration_days": 4,
                    "macro_profile": None,
                    "pattern": "Owner plan",
                    "restrictions": [],
                    "notes": None,
                }
            ],
        },
    )
    cycle_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/users/me/nutrition/{cycle_id}", headers=other_headers)
    assert get_response.status_code == 404

    patch_response = client.patch(
        f"/api/v1/users/me/nutrition/{cycle_id}",
        headers=other_headers,
        json={"name": "Hijacked"},
    )
    assert patch_response.status_code == 404

    delete_response = client.delete(f"/api/v1/users/me/nutrition/{cycle_id}", headers=other_headers)
    assert delete_response.status_code == 404


def test_create_nutrition_plan_rejects_empty_phase_payload(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/users/me/nutrition",
        headers=headers,
        json={
            "cycle_type": "custom",
            "name": "Invalid Plan",
            "phase_started_at": "2026-04-08",
            "phases": [
                {
                    "name": "Empty Phase",
                    "duration_days": 3,
                    "macro_profile": None,
                    "pattern": None,
                    "restrictions": [],
                    "notes": None,
                }
            ],
        },
    )

    assert response.status_code == 422
