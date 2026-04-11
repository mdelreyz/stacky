"""Apply manually curated catalog profiles stored in apps/api/data/manual_catalog_profiles.json.

Usage:
    python -m scripts.apply_manual_catalog_profiles
    python -m scripts.apply_manual_catalog_profiles --name "1-MNA"
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
from app.models.supplement import Supplement

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "manual_catalog_profiles.json"


def load_entries() -> list[dict]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


async def apply_entries(name: str | None = None) -> None:
    entries = load_entries()
    if name:
        entries = [entry for entry in entries if entry["name"].lower() == name.lower()]

    if not entries:
        print("No matching manual catalog profiles found.")
        return

    async with async_session_factory() as session:
        for entry in entries:
            result = await session.execute(
                select(Supplement).where(
                    Supplement.name == entry["name"],
                    Supplement.created_by_user_id.is_(None),
                )
            )
            supplement = result.scalar_one_or_none()
            if supplement is None:
                print(f"Skipped missing catalog supplement: {entry['name']}")
                continue

            if "description" in entry:
                supplement.description = entry["description"]
            if "goals" in entry:
                supplement.goals = entry["goals"]
            if "mechanism_tags" in entry:
                supplement.mechanism_tags = entry["mechanism_tags"]
            if "form" in entry:
                supplement.form = entry["form"]

            supplement.ai_profile = entry["ai_profile"]
            supplement.ai_generated_at = datetime.now(timezone.utc)
            supplement.ai_profile_version = max(supplement.ai_profile_version, 2)
            supplement.is_verified = True

            print(f"Applied manual profile: {supplement.name}")

        await session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply manual catalog supplement profiles")
    parser.add_argument("--name", type=str, default=None, help="Apply only one exact supplement name")
    args = parser.parse_args()
    asyncio.run(apply_entries(name=args.name))


if __name__ == "__main__":
    main()
