import asyncio

from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory
from app.models.medication import Medication, MedicationCategory


def signup(client) -> tuple[dict[str, str], str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Score",
            "last_name": "Test",
            "email": "score@example.com",
            "password": "Password123",
        },
    )
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def seed_supplements():
    """Seed a diverse set of supplements with AI profiles for scoring."""
    async def _seed():
        async with async_session_factory() as session:
            omega = Supplement(
                name="Omega-3 Fish Oil",
                category=SupplementCategory.cardiovascular,
                form="softgel",
                goals=["longevity", "cardiovascular"],
                ai_profile={
                    "common_names": ["Omega-3", "Fish Oil", "EPA/DHA"],
                    "evidence_quality": "strong",
                    "known_interactions": [],
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
                    "evidence_quality": "strong",
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
                    "evidence_quality": "strong",
                    "known_interactions": [
                        {
                            "substance": "Iron",
                            "type": "caution",
                            "severity": "moderate",
                            "description": "Magnesium may reduce iron absorption.",
                        }
                    ],
                },
                is_verified=True,
            )
            vitamin_k2 = Supplement(
                name="Vitamin K2 MK-7",
                category=SupplementCategory.cardiovascular,
                form="capsule",
                goals=["longevity", "cardiovascular"],
                ai_profile={
                    "common_names": ["Vitamin K2", "MK-7"],
                    "evidence_quality": "moderate",
                    "known_interactions": [],
                },
                is_verified=True,
            )
            curcumin = Supplement(
                name="Curcumin",
                category=SupplementCategory.inflammation_antioxidant,
                form="capsule",
                goals=["longevity", "joint_health"],
                ai_profile={
                    "common_names": ["Curcumin", "Turmeric Extract"],
                    "evidence_quality": "moderate",
                    "known_interactions": [],
                },
                is_verified=True,
            )
            piperine = Supplement(
                name="Piperine",
                category=SupplementCategory.gut_digestion,
                form="capsule",
                goals=["gut_health"],
                ai_profile={
                    "common_names": ["Piperine", "BioPerine"],
                    "evidence_quality": "moderate",
                    "known_interactions": [],
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
                    "evidence_quality": "strong",
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
                            "description": "Vitamin K directly antagonizes warfarin.",
                        },
                    ],
                },
                is_verified=True,
            )
            session.add_all([omega, vitamin_d, magnesium, vitamin_k2, curcumin, piperine, iron, warfarin])
            await session.commit()

            return {
                "omega_id": str(omega.id),
                "d3_id": str(vitamin_d.id),
                "mag_id": str(magnesium.id),
                "k2_id": str(vitamin_k2.id),
                "curcumin_id": str(curcumin.id),
                "piperine_id": str(piperine.id),
                "iron_id": str(iron.id),
                "warfarin_id": str(warfarin.id),
            }

    return asyncio.run(_seed())


def _set_preferences(client, headers, goals):
    client.put(
        "/api/v1/users/me/preferences",
        json={"primary_goals": goals, "interaction_mode": "advanced"},
        headers=headers,
    )


def _apply(client, headers, items):
    client.post(
        "/api/v1/users/me/preferences/recommendations/apply",
        json={"items": items},
        headers=headers,
    )


def test_stack_score_empty_regimen(client):
    headers, _ = signup(client)
    seed_supplements()

    response = client.get("/api/v1/users/me/preferences/stack-score", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_score"] == 0
    assert body["item_count"] == 0
    assert body["dimensions"] == []
    assert any("Add items" in s for s in body["suggestions"])


def test_stack_score_single_supplement(client):
    headers, _ = signup(client)
    ids = seed_supplements()
    _set_preferences(client, headers, ["longevity"])
    _apply(client, headers, [{"catalog_id": ids["d3_id"], "item_type": "supplement"}])

    response = client.get("/api/v1/users/me/preferences/stack-score", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_score"] > 0
    assert body["item_count"] == 1
    assert len(body["dimensions"]) == 5
    dim_names = {d["name"] for d in body["dimensions"]}
    assert dim_names == {"Goal Coverage", "Evidence Quality", "Interaction Safety", "Synergy Bonus", "Diversity"}
    # Single item means no synergies
    assert len(body["synergies_found"]) == 0
    # Should suggest broader stack
    assert any("broader" in s.lower() or "3-5" in s for s in body["suggestions"])


def test_stack_score_detects_d3_k2_synergy(client):
    headers, _ = signup(client)
    ids = seed_supplements()
    _set_preferences(client, headers, ["longevity", "cardiovascular"])
    _apply(client, headers, [
        {"catalog_id": ids["d3_id"], "item_type": "supplement"},
        {"catalog_id": ids["k2_id"], "item_type": "supplement"},
        {"catalog_id": ids["omega_id"], "item_type": "supplement"},
    ])

    response = client.get("/api/v1/users/me/preferences/stack-score", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["item_count"] == 3
    # D3 + K2 synergy should be detected
    synergy_pairs = [(s["item_a"], s["item_b"]) for s in body["synergies_found"]]
    assert ("Vitamin D3", "Vitamin K2 MK-7") in synergy_pairs or \
           ("Vitamin K2 MK-7", "Vitamin D3") in synergy_pairs
    # Also Magnesium + D3 if mag present — only 3 items here so just D3+K2
    assert body["total_score"] > 30


def test_stack_score_detects_curcumin_piperine_synergy(client):
    headers, _ = signup(client)
    ids = seed_supplements()
    _set_preferences(client, headers, ["longevity", "joint_health"])
    _apply(client, headers, [
        {"catalog_id": ids["curcumin_id"], "item_type": "supplement"},
        {"catalog_id": ids["piperine_id"], "item_type": "supplement"},
        {"catalog_id": ids["omega_id"], "item_type": "supplement"},
    ])

    response = client.get("/api/v1/users/me/preferences/stack-score", headers=headers)

    assert response.status_code == 200
    body = response.json()
    synergy_pairs = [(s["item_a"], s["item_b"]) for s in body["synergies_found"]]
    assert ("Curcumin", "Piperine") in synergy_pairs
    # Also omega + curcumin synergy
    assert ("Omega-3 Fish Oil", "Curcumin") in synergy_pairs


def test_stack_score_penalizes_interactions(client):
    """Stack with magnesium + iron should have lower safety score."""
    headers, _ = signup(client)
    ids = seed_supplements()
    _set_preferences(client, headers, ["longevity", "energy"])
    _apply(client, headers, [
        {"catalog_id": ids["mag_id"], "item_type": "supplement"},
        {"catalog_id": ids["iron_id"], "item_type": "supplement"},
        {"catalog_id": ids["d3_id"], "item_type": "supplement"},
    ])

    response = client.get("/api/v1/users/me/preferences/stack-score", headers=headers)

    assert response.status_code == 200
    body = response.json()
    safety_dim = next(d for d in body["dimensions"] if d["name"] == "Interaction Safety")
    assert safety_dim["score"] < 1.0  # Should be penalized
    assert "interaction" in safety_dim["details"].lower()


def test_stack_score_critical_interaction_tanks_safety(client):
    """Warfarin + K2 is critical — safety should drop significantly."""
    headers, _ = signup(client)
    ids = seed_supplements()
    _set_preferences(client, headers, ["cardiovascular"])
    _apply(client, headers, [
        {"catalog_id": ids["k2_id"], "item_type": "supplement"},
        {"catalog_id": ids["warfarin_id"], "item_type": "medication"},
    ])

    response = client.get("/api/v1/users/me/preferences/stack-score", headers=headers)

    assert response.status_code == 200
    body = response.json()
    safety_dim = next(d for d in body["dimensions"] if d["name"] == "Interaction Safety")
    assert safety_dim["score"] <= 0.5  # Critical interaction
    # Should suggest reviewing the interaction
    assert any("review" in s.lower() or "consult" in s.lower() for s in body["suggestions"])


def test_stack_score_high_diversity_well_covered(client):
    """A diverse stack covering multiple body systems should score well."""
    headers, _ = signup(client)
    ids = seed_supplements()
    _set_preferences(client, headers, ["longevity", "cardiovascular", "sleep"])
    _apply(client, headers, [
        {"catalog_id": ids["omega_id"], "item_type": "supplement"},
        {"catalog_id": ids["d3_id"], "item_type": "supplement"},
        {"catalog_id": ids["mag_id"], "item_type": "supplement"},
        {"catalog_id": ids["k2_id"], "item_type": "supplement"},
        {"catalog_id": ids["curcumin_id"], "item_type": "supplement"},
    ])

    response = client.get("/api/v1/users/me/preferences/stack-score", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["item_count"] == 5
    diversity_dim = next(d for d in body["dimensions"] if d["name"] == "Diversity")
    assert diversity_dim["score"] >= 0.75  # 4+ categories covered
    assert body["total_score"] >= 50  # Should be a solid score
