from app.models.medication import MedicationCategory
from app.models.supplement import SupplementCategory
from app.services.ai_profile_generation import MedicationAIProfile, SupplementAIProfile


def _base_supplement_profile(evidence_quality: str) -> dict:
    return {
        "common_names": ["Example Supplement"],
        "category": SupplementCategory.immune_antimicrobial,
        "mechanism_of_action": "Example mechanism.",
        "typical_dosages": [
            {
                "amount": 1,
                "unit": "capsule",
                "frequency": "daily",
                "context": "general_support",
            }
        ],
        "forms": ["capsule"],
        "bioavailability": {
            "notes": "Stable enough.",
            "enhancers": [],
            "inhibitors": [],
        },
        "half_life": {
            "hours": "6-8",
            "notes": "Approximate range.",
        },
        "timing_recommendations": {
            "preferred_windows": ["morning_with_food"],
            "avoid_windows": [],
            "with_food": True,
            "food_interactions": "None notable.",
            "notes": "Flexible.",
        },
        "cycling_recommendations": {
            "suggested": False,
            "typical_pattern": None,
            "rationale": "Not typically required.",
        },
        "known_interactions": [],
        "synergies": [],
        "contraindications": [],
        "side_effects": [],
        "safety_notes": "Generally well tolerated.",
        "evidence_quality": evidence_quality,
        "sources_summary": "Example evidence summary.",
    }


def _base_medication_profile(evidence_quality: str) -> dict:
    return {
        "common_names": ["Example Medication"],
        "category": MedicationCategory.metabolic,
        "drug_class": "example_class",
        "mechanism_of_action": "Example mechanism.",
        "typical_dosages": [
            {
                "amount": 1,
                "unit": "tablet",
                "frequency": "daily",
                "context": "maintenance",
            }
        ],
        "forms": ["tablet"],
        "bioavailability": {
            "notes": "Predictable absorption.",
            "enhancers": [],
            "inhibitors": [],
        },
        "half_life": {
            "hours": "12",
            "notes": "Approximate range.",
        },
        "timing_recommendations": {
            "preferred_windows": ["morning_with_food"],
            "avoid_windows": [],
            "with_food": True,
            "food_interactions": "None notable.",
            "notes": "Flexible.",
        },
        "known_interactions": [],
        "contraindications": [],
        "side_effects": [],
        "monitoring_notes": "Routine monitoring as indicated.",
        "safety_notes": "Use clinical judgment.",
        "evidence_quality": evidence_quality,
        "sources_summary": "Example evidence summary.",
    }


def test_supplement_ai_profile_accepts_traditional_evidence_quality():
    profile = SupplementAIProfile.model_validate(_base_supplement_profile("traditional"))

    assert profile.evidence_quality == "traditional"


def test_medication_ai_profile_accepts_speculative_evidence_quality():
    profile = MedicationAIProfile.model_validate(_base_medication_profile("speculative"))

    assert profile.evidence_quality == "speculative"
