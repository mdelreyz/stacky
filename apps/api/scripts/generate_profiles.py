"""Batch-generate AI profiles for catalog supplements missing them.

Usage:
    python -m scripts.generate_profiles              # all without profiles
    python -m scripts.generate_profiles --limit 10   # first 10 only
    python -m scripts.generate_profiles --dry-run     # preview without generating
"""

import argparse
import asyncio
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import func, select

from app.config import settings
from app.database import async_session_factory, engine, Base
from app.models.supplement import Supplement
from app.services.ai_onboarding import (
    generate_supplement_profile,
    get_ai_unavailable_reason,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def generate_profiles(limit: int | None = None, dry_run: bool = False) -> None:
    reason = get_ai_unavailable_reason()
    if reason and not dry_run:
        logger.error(reason)
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        query = (
            select(Supplement)
            .where(Supplement.ai_profile.is_(None))
            .where(Supplement.created_by_user_id.is_(None))  # catalog only
            .order_by(Supplement.name)
        )
        if limit:
            query = query.limit(limit)

        result = await session.execute(query)
        supplements = result.scalars().all()

        total_count = (
            await session.execute(
                select(func.count())
                .select_from(Supplement)
                .where(Supplement.ai_profile.is_(None))
                .where(Supplement.created_by_user_id.is_(None))
            )
        ).scalar_one()

    batch_size = len(supplements)
    logger.info(
        "Found %d catalog supplements without AI profiles (%d selected)",
        total_count,
        batch_size,
    )

    if dry_run:
        for s in supplements:
            print(f"  [dry-run] {s.name} ({s.category.value})")
        return

    if not supplements:
        logger.info("Nothing to generate.")
        return

    succeeded = 0
    failed = 0

    for i, supplement in enumerate(supplements, 1):
        logger.info("[%d/%d] Generating profile for: %s", i, batch_size, supplement.name)
        start = time.time()

        try:
            profile = await asyncio.to_thread(
                generate_supplement_profile,
                supplement.name,
                supplement.category.value if supplement.category else None,
                supplement.form,
            )
        except Exception as exc:
            logger.error("  FAILED: %s", exc)
            failed += 1
            continue

        elapsed = time.time() - start

        # Persist the profile
        async with async_session_factory() as session:
            from datetime import datetime, timezone

            result = await session.execute(
                select(Supplement).where(Supplement.id == supplement.id)
            )
            db_supplement = result.scalar_one()
            db_supplement.ai_profile = profile
            db_supplement.ai_profile_version = 1
            db_supplement.ai_generated_at = datetime.now(timezone.utc)
            db_supplement.is_verified = True
            await session.commit()

        succeeded += 1
        logger.info("  OK (%.1fs)", elapsed)

    logger.info(
        "Done. %d succeeded, %d failed out of %d.", succeeded, failed, batch_size
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate AI profiles for catalog supplements")
    parser.add_argument("--limit", type=int, default=None, help="Max supplements to process")
    parser.add_argument("--dry-run", action="store_true", help="Preview without generating")
    args = parser.parse_args()

    asyncio.run(generate_profiles(limit=args.limit, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
