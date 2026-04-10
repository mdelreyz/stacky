import asyncio

from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory


def signup(client) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Preference",
            "last_name": "User",
            "email": "prefs@example.com",
            "password": "Password123",
        },
    )
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def seed_supplements():
    async def _seed():
        async with async_session_factory() as session:
            supplements = [
                Supplement(
                    name="Omega-3 Fish Oil",
                    category=SupplementCategory.cardiovascular,
                    form="softgel",
                    goals=["longevity", "cardiovascular"],
                    mechanism_tags=["anti-inflammatory"],
                ),
                Supplement(
                    name="Vitamin D3",
                    category=SupplementCategory.immune_antimicrobial,
                    form="capsule",
                    goals=["longevity", "immunity"],
                    mechanism_tags=[],
                ),
                Supplement(
                    name="Magnesium Glycinate",
                    category=SupplementCategory.sleep_recovery,
                    form="capsule",
                    goals=["longevity", "sleep"],
                    mechanism_tags=[],
                ),
                Supplement(
                    name="Creatine Monohydrate",
                    category=SupplementCategory.energy_mitochondria,
                    form="powder",
                    goals=["longevity", "energy", "cognitive"],
                    mechanism_tags=["mitochondrial support"],
                ),
                Supplement(
                    name="Lion's Mane Mushroom",
                    category=SupplementCategory.brain_mood_stress,
                    form="capsule",
                    goals=["cognitive"],
                    mechanism_tags=["neuroprotective"],
                ),
                Supplement(
                    name="CoQ10 (Ubiquinol)",
                    category=SupplementCategory.energy_mitochondria,
                    form="softgel",
                    goals=["longevity", "energy", "cardiovascular"],
                    mechanism_tags=["antioxidant", "mitochondrial support"],
                ),
            ]
            session.add_all(supplements)
            await session.commit()

    asyncio.run(_seed())


def test_preferences_upsert_and_get(client):
    headers, _ = signup(client)

    get_response = client.get("/api/v1/users/me/preferences", headers=headers)
    assert get_response.status_code == 404

    put_response = client.put(
        "/api/v1/users/me/preferences",
        json={
            "interaction_mode": "guided",
            "max_supplements_per_day": 5,
            "max_tablets_per_day": 8,
            "primary_goals": ["longevity", "cognitive"],
            "focus_concerns": ["brain fog"],
            "age": 35,
            "biological_sex": "male",
            "exercise_blocks_per_week": 4,
            "exercise_minutes_per_day": 45,
        },
        headers=headers,
    )
    assert put_response.status_code == 200
    body = put_response.json()
    assert body["interaction_mode"] == "guided"
    assert body["max_supplements_per_day"] == 5
    assert body["primary_goals"] == ["longevity", "cognitive"]
    assert body["age"] == 35

    get_response = client.get("/api/v1/users/me/preferences", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["max_supplements_per_day"] == 5


def test_preferences_patch_updates_single_field(client):
    headers, _ = signup(client)

    client.put(
        "/api/v1/users/me/preferences",
        json={"max_supplements_per_day": 5, "primary_goals": ["longevity"]},
        headers=headers,
    )

    patch_response = client.patch(
        "/api/v1/users/me/preferences",
        json={"max_supplements_per_day": 3},
        headers=headers,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["max_supplements_per_day"] == 3
    assert patch_response.json()["primary_goals"] == ["longevity"]


def test_preferences_accepts_higher_supplement_and_medication_caps(client):
    headers, _ = signup(client)

    response = client.put(
        "/api/v1/users/me/preferences",
        json={"max_supplements_per_day": 100, "max_medications": 100},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["max_supplements_per_day"] == 100
    assert body["max_medications"] == 100


def test_preferences_upsert_overwrites_on_second_put(client):
    headers, _ = signup(client)

    client.put(
        "/api/v1/users/me/preferences",
        json={"max_supplements_per_day": 10, "primary_goals": ["sleep"]},
        headers=headers,
    )

    second_response = client.put(
        "/api/v1/users/me/preferences",
        json={"max_supplements_per_day": 3, "primary_goals": ["cognitive", "energy"]},
        headers=headers,
    )
    assert second_response.status_code == 200
    assert second_response.json()["max_supplements_per_day"] == 3
    assert second_response.json()["primary_goals"] == ["cognitive", "energy"]


def test_recommendations_returns_ranked_items_from_catalog(client):
    """Static fallback produces ranked results from seeded catalog."""
    headers, _ = signup(client)
    seed_supplements()

    response = client.post(
        "/api/v1/users/me/preferences/recommendations",
        json={"max_items": 3, "goals": ["longevity"], "item_types": ["supplement"]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 3
    assert body["slot_budget"] == 3
    assert body["goals_used"] == ["longevity"]
    assert all(item["item_type"] == "supplement" for item in body["items"])
    # Omega-3, Vitamin D3, Magnesium should be top 3 for longevity
    names = [item["name"] for item in body["items"]]
    assert "Omega-3 Fish Oil" in names
    assert "Vitamin D3" in names
    assert "Magnesium Glycinate" in names
    assert body["items"][0]["priority_rank"] == 1
    assert body["items"][1]["priority_rank"] == 2


def test_recommendations_shift_ranking_for_cognitive_goal(client):
    headers, _ = signup(client)
    seed_supplements()

    response = client.post(
        "/api/v1/users/me/preferences/recommendations",
        json={"max_items": 3, "goals": ["cognitive"], "item_types": ["supplement"]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    names = [item["name"] for item in body["items"]]
    assert "Lion's Mane Mushroom" in names


def test_recommendations_excludes_current_user_items(client):
    headers, _ = signup(client)
    seed_supplements()

    # Add Omega-3 to user's active supplements
    async def _get_omega_id():
        async with async_session_factory() as session:
            from sqlalchemy import select

            result = await session.execute(
                select(Supplement).where(Supplement.name == "Omega-3 Fish Oil")
            )
            return str(result.scalar_one().id)

    omega_id = asyncio.run(_get_omega_id())

    client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": omega_id,
            "dosage_amount": 2,
            "dosage_unit": "softgels",
            "frequency": "daily",
            "take_window": "morning_with_food",
            "with_food": True,
            "started_at": "2026-04-08",
        },
        headers=headers,
    )

    response = client.post(
        "/api/v1/users/me/preferences/recommendations",
        json={
            "max_items": 3,
            "goals": ["longevity"],
            "item_types": ["supplement"],
            "exclude_current": True,
        },
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    names = [item["name"] for item in body["items"]]
    assert "Omega-3 Fish Oil" not in names
    assert body["items_excluded_current"] == 1


def test_recommendations_respects_preferences_slot_budget(client):
    headers, _ = signup(client)
    seed_supplements()

    client.put(
        "/api/v1/users/me/preferences",
        json={"max_supplements_per_day": 2},
        headers=headers,
    )

    response = client.post(
        "/api/v1/users/me/preferences/recommendations",
        json={"max_items": 10, "goals": ["longevity"], "item_types": ["supplement"]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["slot_budget"] == 2
    assert len(body["items"]) <= 2
