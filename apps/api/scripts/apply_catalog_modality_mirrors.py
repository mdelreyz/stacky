"""Mirror approved supplement-catalog rows into other shared catalogs.

Usage:
    python -m scripts.apply_catalog_modality_mirrors
    python -m scripts.apply_catalog_modality_mirrors --name HGH
"""

import argparse
import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import async_session_factory
from app.models.medication import Medication, MedicationCategory
from app.models.peptide import Peptide, PeptideCategory
from app.models.supplement import Supplement
from app.models.therapy import Therapy, TherapyCategory

MANUAL_PROFILES_PATH = Path(__file__).resolve().parent.parent / "data" / "manual_catalog_profiles.json"
MIRRORS_PATH = Path(__file__).resolve().parent.parent / "data" / "catalog_modality_mirrors.json"


def _load_json(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def _build_profile_lookup(entries: list[dict]) -> dict[str, dict]:
    return {entry["name"]: entry for entry in entries}


def _apply_medication_fields(medication: Medication, entry: dict, category: str, now: datetime) -> None:
    medication.category = MedicationCategory(category)
    medication.form = entry.get("form")
    medication.description = entry.get("description")
    medication.ai_profile = entry.get("ai_profile")
    medication.ai_generated_at = now
    medication.ai_profile_version = max(medication.ai_profile_version or 0, 2)
    medication.is_verified = bool(entry.get("ai_profile"))


def _apply_therapy_fields(therapy: Therapy, entry: dict, category: str, now: datetime) -> None:
    therapy.category = TherapyCategory(category)
    therapy.description = entry.get("description")
    therapy.ai_profile = entry.get("ai_profile")
    therapy.ai_generated_at = now
    therapy.ai_profile_version = max(therapy.ai_profile_version or 0, 2)


def _apply_peptide_fields(peptide: Peptide, entry: dict, category: str, now: datetime) -> None:
    peptide.category = PeptideCategory(category)
    peptide.form = entry.get("form")
    peptide.description = entry.get("description")
    peptide.goals = entry.get("goals")
    peptide.mechanism_tags = entry.get("mechanism_tags")
    peptide.ai_profile = entry.get("ai_profile")
    peptide.ai_generated_at = now
    peptide.ai_profile_version = max(peptide.ai_profile_version or 0, 2)
    peptide.is_verified = bool(entry.get("ai_profile"))


async def apply_mirrors(name: str | None = None) -> None:
    manual_entries = _load_json(MANUAL_PROFILES_PATH)
    mirror_specs = _load_json(MIRRORS_PATH)
    if name:
        mirror_specs = [spec for spec in mirror_specs if spec["source_name"].lower() == name.lower()]

    if not mirror_specs:
        print("No matching modality mirrors found.")
        return

    entry_lookup = _build_profile_lookup(manual_entries)
    now = datetime.now(timezone.utc)

    async with async_session_factory() as session:
        for spec in mirror_specs:
            source_name = spec["source_name"]
            target_name = spec.get("target_name", source_name)
            entry = entry_lookup.get(source_name)
            if entry is None:
                print(f"Skipped missing manual profile entry: {source_name}")
                continue

            supplement_result = await session.execute(
                select(Supplement).where(
                    Supplement.name == source_name,
                    Supplement.created_by_user_id.is_(None),
                )
            )
            supplement = supplement_result.scalar_one_or_none()
            if supplement is None:
                print(f"Skipped missing catalog supplement row: {source_name}")
                continue

            target_catalog = spec["target_catalog"]
            category = spec["category"]

            if target_catalog == "medications":
                result = await session.execute(select(Medication).where(Medication.name == target_name))
                medication = result.scalar_one_or_none()
                if medication is None:
                    medication = Medication(name=target_name, category=MedicationCategory(category))
                    session.add(medication)
                _apply_medication_fields(medication, entry, category, now)
            elif target_catalog == "therapies":
                result = await session.execute(select(Therapy).where(Therapy.name == target_name))
                therapy = result.scalar_one_or_none()
                if therapy is None:
                    therapy = Therapy(name=target_name, category=TherapyCategory(category))
                    session.add(therapy)
                _apply_therapy_fields(therapy, entry, category, now)
            elif target_catalog == "peptides":
                result = await session.execute(select(Peptide).where(Peptide.name == target_name))
                peptide = result.scalar_one_or_none()
                if peptide is None:
                    peptide = Peptide(name=target_name, category=PeptideCategory(category))
                    session.add(peptide)
                _apply_peptide_fields(peptide, entry, category, now)
            else:
                print(f"Skipped unsupported target catalog: {target_catalog}")
                continue

            print(f"Mirrored {source_name} -> {target_catalog}:{target_name}")

        await session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Mirror approved supplement rows into shared modality catalogs")
    parser.add_argument("--name", type=str, default=None, help="Apply only one exact source supplement name")
    args = parser.parse_args()
    asyncio.run(apply_mirrors(name=args.name))


if __name__ == "__main__":
    main()
