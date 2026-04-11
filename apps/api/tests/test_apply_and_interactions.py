import asyncio

from sqlalchemy import select

from app.database import async_session_factory
from app.models.enums import TakeWindow
from app.models.supplement import Supplement, SupplementCategory
from app.models.medication import Medication, MedicationCategory
from app.models.user_medication import UserMedication
from app.models.user_supplement import UserSupplement


def signup(client) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Apply",
            "last_name": "Test",
            "email": "apply@example.com",
            "password": "Password123",
        },
    )
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def seed_catalog():
    """Seed supplements with AI profiles containing known_interactions."""
    async def _seed():
        async with async_session_factory() as session:
            omega = Supplement(
                name="Omega-3 Fish Oil",
                category=SupplementCategory.cardiovascular,
                form="softgel",
                goals=["longevity", "cardiovascular"],
                ai_profile={
                    "common_names": ["Omega-3", "Fish Oil", "EPA/DHA"],
                    "known_interactions": [
                        {
                            "substance": "Warfarin",
                            "type": "caution",
                            "severity": "major",
                            "description": "Omega-3 may enhance anticoagulant effects of warfarin, increasing bleeding risk.",
                        }
                    ],
                },
                is_verified=True,
            )
            vitamin_d = Supplement(
                name="Vitamin D3",
                category=SupplementCategory.immune_antimicrobial,
                form="capsule",
                goals=["longevity", "immunity"],
                ai_profile={
                    "common_names": ["Vitamin D", "Cholecalciferol"],
                    "known_interactions": [],
                },
                is_verified=True,
            )
            magnesium = Supplement(
                name="Magnesium Glycinate",
                category=SupplementCategory.sleep_recovery,
                form="capsule",
                goals=["longevity", "sleep"],
                ai_profile={
                    "common_names": ["Magnesium", "Mag Glycinate"],
                    "known_interactions": [
                        {
                            "substance": "Iron",
                            "type": "caution",
                            "severity": "moderate",
                            "description": "Magnesium may reduce iron absorption when taken together.",
                        }
                    ],
                },
                is_verified=True,
            )
            iron = Supplement(
                name="Iron Bisglycinate",
                category=SupplementCategory.energy_mitochondria,
                form="capsule",
                goals=["energy"],
                ai_profile={
                    "common_names": ["Iron", "Iron Bisglycinate"],
                    "known_interactions": [
                        {
                            "substance": "Magnesium",
                            "type": "caution",
                            "severity": "moderate",
                            "description": "Iron competes with magnesium for absorption.",
                        }
                    ],
                },
                is_verified=True,
            )
            warfarin = Medication(
                name="Warfarin",
                category=MedicationCategory.cardiovascular,
                form="tablet",
                ai_profile={
                    "common_names": ["Warfarin", "Coumadin"],
                    "known_interactions": [
                        {
                            "substance": "Fish Oil",
                            "type": "caution",
                            "severity": "major",
                            "description": "Fish oil may potentiate anticoagulant effects.",
                        },
                        {
                            "substance": "Vitamin K2",
                            "type": "contraindication",
                            "severity": "critical",
                            "description": "Vitamin K directly antagonizes warfarin's mechanism of action.",
                        },
                    ],
                },
                is_verified=True,
            )
            session.add_all([omega, vitamin_d, magnesium, iron, warfarin])
            await session.commit()

            return {
                "omega_id": str(omega.id),
                "d3_id": str(vitamin_d.id),
                "mag_id": str(magnesium.id),
                "iron_id": str(iron.id),
                "warfarin_id": str(warfarin.id),
            }

    return asyncio.run(_seed())


def test_apply_recommendations_creates_user_items(client):
    headers, _ = signup(client)
    ids = seed_catalog()

    response = client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["omega_id"], "item_type": "supplement"},
                {"catalog_id": ids["d3_id"], "item_type": "supplement", "dosage_amount": 5000, "dosage_unit": "IU"},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["applied"]) == 2
    assert body["protocol_id"] is None
    names = {item["name"] for item in body["applied"]}
    assert names == {"Omega-3 Fish Oil", "Vitamin D3"}

    # Verify items appear in user's active supplements
    list_response = client.get("/api/v1/users/me/supplements?active_only=true", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 2


def test_apply_recommendations_creates_protocol(client):
    headers, _ = signup(client)
    ids = seed_catalog()

    response = client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["omega_id"], "item_type": "supplement"},
                {"catalog_id": ids["mag_id"], "item_type": "supplement"},
            ],
            "protocol_name": "AI Morning Stack",
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["protocol_name"] == "AI Morning Stack"
    assert body["protocol_id"] is not None

    # Verify protocol exists with both items
    protocol_response = client.get(f"/api/v1/users/me/protocols/{body['protocol_id']}", headers=headers)
    assert protocol_response.status_code == 200
    assert len(protocol_response.json()["items"]) == 2


def test_apply_recommendations_normalizes_legacy_take_window_aliases(client):
    headers, user_id = signup(client)
    ids = seed_catalog()

    response = client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["omega_id"], "item_type": "supplement", "take_window": "with_meals"},
                {"catalog_id": ids["warfarin_id"], "item_type": "medication", "take_window": "evening_with_food"},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 201

    async def _load():
        async with async_session_factory() as session:
            supplement = (
                await session.execute(select(UserSupplement).where(UserSupplement.user_id == user_id))
            ).scalar_one()
            medication = (
                await session.execute(select(UserMedication).where(UserMedication.user_id == user_id))
            ).scalar_one()
            return supplement, medication

    supplement, medication = asyncio.run(_load())
    assert supplement.take_window == TakeWindow.morning_with_food
    assert supplement.with_food is True
    assert medication.take_window == TakeWindow.evening
    assert medication.with_food is True


def test_apply_skips_already_active_items(client):
    headers, _ = signup(client)
    ids = seed_catalog()

    # Add omega-3 first
    client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": ids["omega_id"],
            "dosage_amount": 2,
            "dosage_unit": "softgels",
            "frequency": "daily",
            "take_window": "morning_with_food",
            "with_food": True,
            "started_at": "2026-04-08",
        },
        headers=headers,
    )

    # Apply recommendations including omega-3 (already active)
    response = client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["omega_id"], "item_type": "supplement"},
                {"catalog_id": ids["d3_id"], "item_type": "supplement"},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["applied"]) == 1
    assert body["applied"][0]["name"] == "Vitamin D3"


def test_apply_returns_400_when_all_already_active(client):
    headers, _ = signup(client)
    ids = seed_catalog()

    # Add omega-3 first
    client.post(
        "/api/v1/users/me/supplements",
        json={
            "supplement_id": ids["omega_id"],
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
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["omega_id"], "item_type": "supplement"},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "All recommended items are already in your active regimen"


def test_interaction_checker_detects_mag_iron_interaction(client):
    headers, _ = signup(client)
    ids = seed_catalog()

    # Add both magnesium and iron
    client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["mag_id"], "item_type": "supplement"},
                {"catalog_id": ids["iron_id"], "item_type": "supplement"},
            ],
        },
        headers=headers,
    )

    response = client.get("/api/v1/users/me/preferences/interactions", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_warnings"] >= 1
    assert body["has_critical"] is False
    names = {(w["item_a"], w["item_b"]) for w in body["warnings"]}
    # Magnesium ↔ Iron interaction (deduplicated, one direction)
    assert any("Magnesium" in a and "Iron" in b or "Iron" in a and "Magnesium" in b for a, b in names)


def test_interaction_checker_detects_cross_type_warfarin_omega(client):
    headers, _ = signup(client)
    ids = seed_catalog()

    # Add omega-3 supplement AND warfarin medication
    client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["omega_id"], "item_type": "supplement"},
                {"catalog_id": ids["warfarin_id"], "item_type": "medication"},
            ],
        },
        headers=headers,
    )

    response = client.get("/api/v1/users/me/preferences/interactions", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_warnings"] >= 1
    assert body["has_major"] is True
    # Should detect omega-3 ↔ warfarin interaction
    descriptions = [w["description"] for w in body["warnings"]]
    assert any("warfarin" in d.lower() or "anticoagulant" in d.lower() or "fish oil" in d.lower() for d in descriptions)


def test_interaction_checker_returns_empty_for_safe_stack(client):
    headers, _ = signup(client)
    ids = seed_catalog()

    # Add only vitamin D3 — no known interactions with anything
    client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={
            "items": [
                {"catalog_id": ids["d3_id"], "item_type": "supplement"},
            ],
        },
        headers=headers,
    )

    response = client.get("/api/v1/users/me/preferences/interactions", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_warnings"] == 0
    assert body["has_critical"] is False
    assert body["has_major"] is False
