"""Integration tests for the exercise pillar — catalog, routines, regimes, sessions, stats, gym locations."""

import asyncio

from app.database import async_session_factory
from app.models.exercise import Exercise
from app.models.enums import ExerciseCategory, ExerciseEquipment, MuscleGroup


def auth_headers(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def seed_exercise(name="Bench Press", category="compound", muscle="chest", equipment="barbell"):
    """Seed a shared catalog exercise (user_id=NULL)."""
    async def _create():
        async with async_session_factory() as session:
            ex = Exercise(
                name=name,
                category=category,
                primary_muscle=muscle,
                equipment=equipment,
                is_compound=True,
            )
            session.add(ex)
            await session.commit()
            await session.refresh(ex)
            return str(ex.id)
    return asyncio.run(_create())


# ─── Exercise Catalog ─────────────────────────────────────────────


def test_list_exercises_includes_catalog_and_custom(client):
    headers = auth_headers(client)
    catalog_id = seed_exercise("Barbell Squat")

    # Create a custom exercise
    resp = client.post("/api/v1/exercises", json={
        "name": "My Rehab Stretch",
        "category": "flexibility",
        "primary_muscle": "hamstrings",
        "equipment": "none",
    }, headers=headers)
    assert resp.status_code == 201
    custom = resp.json()
    assert custom["user_id"] is not None

    # List should include both
    resp = client.get("/api/v1/exercises", headers=headers)
    assert resp.status_code == 200
    names = [e["name"] for e in resp.json()["items"]]
    assert "Barbell Squat" in names
    assert "My Rehab Stretch" in names


def test_create_custom_exercise(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/exercises", json={
        "name": "Banded Hip Circle",
        "category": "bodyweight",
        "primary_muscle": "glutes",
        "equipment": "resistance_band",
        "description": "Hip circles with a resistance band for glute activation",
        "is_compound": False,
    }, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Banded Hip Circle"
    assert body["user_id"] is not None
    assert body["equipment"] == "resistance_band"


def test_update_custom_exercise(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/exercises", json={
        "name": "Original Name",
        "category": "isolation",
        "primary_muscle": "biceps",
        "equipment": "dumbbell",
    }, headers=headers)
    ex_id = resp.json()["id"]

    resp = client.patch(f"/api/v1/exercises/{ex_id}", json={
        "name": "Updated Name",
        "description": "Now with description",
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


def test_cannot_edit_catalog_exercise(client):
    headers = auth_headers(client)
    catalog_id = seed_exercise("Deadlift")

    resp = client.patch(f"/api/v1/exercises/{catalog_id}", json={
        "name": "Hacked Name",
    }, headers=headers)
    assert resp.status_code == 404


def test_delete_custom_exercise(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/exercises", json={
        "name": "Temp Exercise",
        "category": "flexibility",
        "primary_muscle": "core",
        "equipment": "none",
    }, headers=headers)
    ex_id = resp.json()["id"]

    resp = client.delete(f"/api/v1/exercises/{ex_id}", headers=headers)
    assert resp.status_code == 204


def test_filter_exercises_by_muscle_and_equipment(client):
    headers = auth_headers(client)
    seed_exercise("Bench Press", "compound", "chest", "barbell")
    seed_exercise("Lat Pulldown", "compound", "back", "cable")

    resp = client.get("/api/v1/exercises?muscle=chest", headers=headers)
    assert resp.status_code == 200
    assert all(e["primary_muscle"] == "chest" for e in resp.json()["items"])

    resp = client.get("/api/v1/exercises?equipment=cable", headers=headers)
    assert all(e["equipment"] == "cable" for e in resp.json()["items"])


def test_mine_only_filter(client):
    headers = auth_headers(client)
    seed_exercise("Catalog Exercise")
    client.post("/api/v1/exercises", json={
        "name": "My Custom",
        "category": "compound",
        "primary_muscle": "chest",
        "equipment": "none",
    }, headers=headers)

    resp = client.get("/api/v1/exercises?mine_only=true", headers=headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "My Custom"


# ─── Workout Routines ─────────────────────────────────────────────


def test_create_routine_with_exercises(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Squat")

    resp = client.post("/api/v1/users/me/routines", json={
        "name": "Leg Day",
        "description": "Focus on quads and glutes",
        "estimated_duration_minutes": 60,
        "exercises": [
            {"exercise_id": ex_id, "sort_order": 0, "target_sets": 4, "target_reps": 8, "target_weight": 100},
        ],
    }, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Leg Day"
    assert len(body["exercises"]) == 1
    assert body["exercises"][0]["target_sets"] == 4


def test_list_routines(client):
    headers = auth_headers(client)
    client.post("/api/v1/users/me/routines", json={"name": "Push"}, headers=headers)
    client.post("/api/v1/users/me/routines", json={"name": "Pull"}, headers=headers)

    resp = client.get("/api/v1/users/me/routines", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


def test_replace_routine_exercises(client):
    headers = auth_headers(client)
    ex1 = seed_exercise("Exercise A")
    ex2 = seed_exercise("Exercise B")

    resp = client.post("/api/v1/users/me/routines", json={
        "name": "Test Routine",
        "exercises": [{"exercise_id": ex1, "sort_order": 0}],
    }, headers=headers)
    routine_id = resp.json()["id"]

    resp = client.put(f"/api/v1/users/me/routines/{routine_id}/exercises", json=[
        {"exercise_id": ex2, "sort_order": 0, "target_sets": 3, "target_reps": 12},
    ], headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()["exercises"]) == 1
    assert resp.json()["exercises"][0]["exercise_id"] == ex2


def test_deactivate_routine(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/users/me/routines", json={"name": "Deletable"}, headers=headers)
    routine_id = resp.json()["id"]

    resp = client.delete(f"/api/v1/users/me/routines/{routine_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/users/me/routines/{routine_id}", headers=headers)
    assert resp.json()["is_active"] is False


# ─── Exercise Regimes ─────────────────────────────────────────────


def test_create_regime_with_schedule(client):
    headers = auth_headers(client)
    # Create a routine first
    resp = client.post("/api/v1/users/me/routines", json={"name": "Push Day"}, headers=headers)
    routine_id = resp.json()["id"]

    resp = client.post("/api/v1/users/me/exercise-regimes", json={
        "name": "PPL Split",
        "schedule": [
            {"routine_id": routine_id, "day_of_week": "monday", "sort_order": 0},
            {"routine_id": routine_id, "day_of_week": "wednesday", "sort_order": 1},
        ],
    }, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "PPL Split"
    assert len(body["schedule_entries"]) == 2


def test_today_routine_from_regime(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/users/me/routines", json={"name": "Daily Routine"}, headers=headers)
    routine_id = resp.json()["id"]

    # Create a regime with all days
    schedule = [
        {"routine_id": routine_id, "day_of_week": day, "sort_order": i}
        for i, day in enumerate(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
    ]
    client.post("/api/v1/users/me/exercise-regimes", json={
        "name": "Every Day",
        "schedule": schedule,
    }, headers=headers)

    resp = client.get("/api/v1/users/me/exercise-regimes/today", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_replace_regime_schedule(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/users/me/routines", json={"name": "Routine A"}, headers=headers)
    routine_a = resp.json()["id"]
    resp = client.post("/api/v1/users/me/routines", json={"name": "Routine B"}, headers=headers)
    routine_b = resp.json()["id"]

    resp = client.post("/api/v1/users/me/exercise-regimes", json={
        "name": "Test Regime",
        "schedule": [{"routine_id": routine_a, "day_of_week": "monday"}],
    }, headers=headers)
    regime_id = resp.json()["id"]

    resp = client.put(f"/api/v1/users/me/exercise-regimes/{regime_id}/schedule", json=[
        {"routine_id": routine_b, "day_of_week": "tuesday"},
        {"routine_id": routine_b, "day_of_week": "thursday"},
    ], headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()["schedule_entries"]) == 2


# ─── Workout Sessions ─────────────────────────────────────────────


def test_start_session_adhoc(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Quick Workout",
        "started_at": "2026-04-09T10:00:00Z",
    }, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Quick Workout"
    assert body["routine_id"] is None
    assert body["logged_exercises"] == []


def test_start_session_from_routine_prepopulates_exercises(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Bench Press")

    resp = client.post("/api/v1/users/me/routines", json={
        "name": "Push",
        "exercises": [{"exercise_id": ex_id, "sort_order": 0, "target_sets": 3}],
    }, headers=headers)
    routine_id = resp.json()["id"]

    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Push Day",
        "started_at": "2026-04-09T10:00:00Z",
        "routine_id": routine_id,
    }, headers=headers)
    assert resp.status_code == 201
    assert len(resp.json()["logged_exercises"]) == 1


def test_add_exercise_to_session(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Pull-Up")

    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Session",
        "started_at": "2026-04-09T10:00:00Z",
    }, headers=headers)
    session_id = resp.json()["id"]

    resp = client.post(f"/api/v1/users/me/sessions/{session_id}/exercises", json={
        "exercise_id": ex_id,
        "sort_order": 0,
    }, headers=headers)
    assert resp.status_code == 201
    assert len(resp.json()["logged_exercises"]) == 1


def test_log_sets_and_complete_session(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Squat")

    # Start session with routine
    resp = client.post("/api/v1/users/me/routines", json={
        "name": "Leg",
        "exercises": [{"exercise_id": ex_id, "sort_order": 0}],
    }, headers=headers)
    routine_id = resp.json()["id"]

    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Leg Day",
        "started_at": "2026-04-09T10:00:00Z",
        "routine_id": routine_id,
    }, headers=headers)
    session_id = resp.json()["id"]
    se_id = resp.json()["logged_exercises"][0]["id"]

    # Log 3 sets
    for i in range(1, 4):
        resp = client.post(
            f"/api/v1/users/me/sessions/{session_id}/exercises/{se_id}/sets",
            json={"set_number": i, "reps": 8, "weight": 100.0, "is_warmup": i == 1},
            headers=headers,
        )
        assert resp.status_code == 201

    # Complete
    resp = client.patch(f"/api/v1/users/me/sessions/{session_id}", json={
        "completed_at": "2026-04-09T11:00:00Z",
        "duration_minutes": 60,
    }, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["completed_at"] is not None
    assert body["duration_minutes"] == 60
    assert len(body["logged_exercises"][0]["sets"]) == 3


def test_update_and_delete_set(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Curl")

    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Arms",
        "started_at": "2026-04-09T10:00:00Z",
    }, headers=headers)
    session_id = resp.json()["id"]

    resp = client.post(f"/api/v1/users/me/sessions/{session_id}/exercises", json={
        "exercise_id": ex_id, "sort_order": 0,
    }, headers=headers)
    se_id = resp.json()["logged_exercises"][0]["id"]

    resp = client.post(
        f"/api/v1/users/me/sessions/{session_id}/exercises/{se_id}/sets",
        json={"set_number": 1, "reps": 10, "weight": 20.0},
        headers=headers,
    )
    set_id = resp.json()["id"]

    # Update
    resp = client.patch(f"/api/v1/users/me/sessions/{session_id}/sets/{set_id}", json={
        "reps": 12, "weight": 22.5,
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["reps"] == 12
    assert resp.json()["weight"] == 22.5

    # Delete
    resp = client.delete(f"/api/v1/users/me/sessions/{session_id}/sets/{set_id}", headers=headers)
    assert resp.status_code == 204


def test_list_sessions_with_date_filter(client):
    headers = auth_headers(client)
    client.post("/api/v1/users/me/sessions", json={
        "name": "Session 1",
        "started_at": "2026-04-01T10:00:00Z",
    }, headers=headers)
    client.post("/api/v1/users/me/sessions", json={
        "name": "Session 2",
        "started_at": "2026-04-09T10:00:00Z",
    }, headers=headers)

    resp = client.get("/api/v1/users/me/sessions?date_from=2026-04-05", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["name"] == "Session 2"


# ─── Exercise Stats ───────────────────────────────────────────────


def test_stats_overview_with_data(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Bench")

    resp = client.post("/api/v1/users/me/routines", json={
        "name": "Push",
        "exercises": [{"exercise_id": ex_id, "sort_order": 0}],
    }, headers=headers)
    routine_id = resp.json()["id"]

    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Push Day",
        "started_at": "2026-04-09T10:00:00Z",
        "routine_id": routine_id,
    }, headers=headers)
    session_id = resp.json()["id"]
    se_id = resp.json()["logged_exercises"][0]["id"]

    client.post(
        f"/api/v1/users/me/sessions/{session_id}/exercises/{se_id}/sets",
        json={"set_number": 1, "reps": 10, "weight": 80.0},
        headers=headers,
    )

    resp = client.get("/api/v1/users/me/exercise-stats/overview", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_sessions"] == 1
    assert body["total_volume"] == 800.0


def test_exercise_progress(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Squat")

    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Legs",
        "started_at": "2026-04-09T10:00:00Z",
    }, headers=headers)
    session_id = resp.json()["id"]

    resp = client.post(f"/api/v1/users/me/sessions/{session_id}/exercises", json={
        "exercise_id": ex_id, "sort_order": 0,
    }, headers=headers)
    se_id = resp.json()["logged_exercises"][0]["id"]

    client.post(
        f"/api/v1/users/me/sessions/{session_id}/exercises/{se_id}/sets",
        json={"set_number": 1, "reps": 5, "weight": 140.0},
        headers=headers,
    )

    resp = client.get(f"/api/v1/users/me/exercise-stats/exercise/{ex_id}", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["max_weight"] == 140.0
    assert body["estimated_1rm"] is not None
    assert body["sessions_count"] == 1


def test_muscle_group_stats(client):
    headers = auth_headers(client)
    ex_id = seed_exercise("Bench", "compound", "chest", "barbell")

    resp = client.post("/api/v1/users/me/sessions", json={
        "name": "Push",
        "started_at": "2026-04-09T10:00:00Z",
    }, headers=headers)
    session_id = resp.json()["id"]
    resp = client.post(f"/api/v1/users/me/sessions/{session_id}/exercises", json={
        "exercise_id": ex_id, "sort_order": 0,
    }, headers=headers)
    se_id = resp.json()["logged_exercises"][0]["id"]

    client.post(
        f"/api/v1/users/me/sessions/{session_id}/exercises/{se_id}/sets",
        json={"set_number": 1, "reps": 10, "weight": 80.0},
        headers=headers,
    )

    resp = client.get("/api/v1/users/me/exercise-stats/muscle-groups", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) >= 1
    assert body[0]["muscle_group"] == "chest"


# ─── Gym Locations ────────────────────────────────────────────────


def test_create_and_list_gym_locations(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/users/me/gym-locations", json={
        "name": "Home Gym",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "radius_meters": 50,
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["name"] == "Home Gym"

    resp = client.get("/api/v1/users/me/gym-locations", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_gym_location_match(client):
    headers = auth_headers(client)
    client.post("/api/v1/users/me/gym-locations", json={
        "name": "Downtown Gym",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "radius_meters": 200,
    }, headers=headers)

    # Match — within radius
    resp = client.post("/api/v1/users/me/gym-locations/match", json={
        "latitude": 34.0523,
        "longitude": -118.2438,
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["matched"] is True
    assert resp.json()["gym_location"]["name"] == "Downtown Gym"

    # No match — too far
    resp = client.post("/api/v1/users/me/gym-locations/match", json={
        "latitude": 35.0,
        "longitude": -119.0,
    }, headers=headers)
    assert resp.json()["matched"] is False


def test_gym_location_with_default_routine(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/users/me/routines", json={"name": "Gym Routine"}, headers=headers)
    routine_id = resp.json()["id"]

    client.post("/api/v1/users/me/gym-locations", json={
        "name": "Main Gym",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "radius_meters": 100,
        "default_routine_id": routine_id,
    }, headers=headers)

    resp = client.post("/api/v1/users/me/gym-locations/match", json={
        "latitude": 40.7128,
        "longitude": -74.0060,
    }, headers=headers)
    assert resp.json()["matched"] is True
    assert resp.json()["default_routine"] is not None
    assert resp.json()["default_routine"]["name"] == "Gym Routine"


def test_delete_gym_location(client):
    headers = auth_headers(client)
    resp = client.post("/api/v1/users/me/gym-locations", json={
        "name": "Temp Gym",
        "latitude": 0.0,
        "longitude": 0.0,
    }, headers=headers)
    loc_id = resp.json()["id"]

    resp = client.delete(f"/api/v1/users/me/gym-locations/{loc_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get("/api/v1/users/me/gym-locations", headers=headers)
    assert len(resp.json()) == 0
