"""Goal progress — maps user goals to stack items and computes per-goal adherence + journal correlation."""

from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.adherence import AdherenceLog
from app.models.health_journal import HealthJournalEntry
from app.models.supplement import Supplement
from app.models.user_medication import UserMedication
from app.models.user_peptide import UserPeptide
from app.models.user_preferences import UserPreferences
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.services.stack_score import GOAL_CATEGORY_MAP

# Goal → journal metric mapping
GOAL_JOURNAL_MAP: dict[str, str] = {
    "sleep": "sleep_quality",
    "energy": "energy_level",
    "cognitive": "mood_level",
    "stress": "stress_level",
}

GOAL_LABELS: dict[str, str] = {
    "longevity": "Longevity",
    "cognitive": "Cognitive",
    "sleep": "Sleep",
    "stress": "Stress",
    "energy": "Energy",
    "immunity": "Immunity",
    "skin": "Skin",
    "hair": "Hair",
    "joint_health": "Joint Health",
    "gut_health": "Gut Health",
    "weight_management": "Weight Management",
    "muscle_recovery": "Muscle Recovery",
    "cardiovascular": "Cardiovascular",
    "hormonal_balance": "Hormonal Balance",
}

GOAL_ICONS: dict[str, str] = {
    "longevity": "hourglass-half",
    "cognitive": "brain",
    "sleep": "moon-o",
    "stress": "heartbeat",
    "energy": "bolt",
    "immunity": "shield",
    "skin": "sun-o",
    "hair": "leaf",
    "joint_health": "hand-rock-o",
    "gut_health": "medkit",
    "weight_management": "balance-scale",
    "muscle_recovery": "trophy",
    "cardiovascular": "heart",
    "hormonal_balance": "refresh",
}


async def compute_goal_progress(
    session: AsyncSession,
    user_id: UUID,
    days: int = 14,
) -> dict:
    """Compute per-goal progress based on stack items and adherence."""
    # Load preferences
    prefs_result = await session.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    preferences = prefs_result.scalar_one_or_none()
    goals = preferences.primary_goals if preferences and preferences.primary_goals else []

    if not goals:
        return {"goals": [], "has_preferences": False}

    # Load active user supplements with catalog data
    supps_result = await session.execute(
        select(UserSupplement).where(
            UserSupplement.user_id == user_id,
            UserSupplement.is_active.is_(True),
        )
    )
    user_supplements = list(supps_result.scalars().all())

    # Load active user medications
    meds_result = await session.execute(
        select(UserMedication).where(
            UserMedication.user_id == user_id,
            UserMedication.is_active.is_(True),
        )
    )
    user_medications = list(meds_result.scalars().all())

    # Load adherence for the period
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, time(23, 59, 59), tzinfo=timezone.utc)

    adherence_result = await session.execute(
        select(AdherenceLog).where(
            AdherenceLog.user_id == user_id,
            AdherenceLog.scheduled_at >= start_dt,
            AdherenceLog.scheduled_at <= end_dt,
        )
    )
    adherence_logs = list(adherence_result.scalars().all())

    # Load journal entries for the period
    journal_result = await session.execute(
        select(HealthJournalEntry).where(
            HealthJournalEntry.user_id == user_id,
            HealthJournalEntry.entry_date >= start_date,
            HealthJournalEntry.entry_date <= end_date,
        ).order_by(HealthJournalEntry.entry_date.asc())
    )
    journal_entries = list(journal_result.scalars().all())

    # Build adherence lookup: item_id → {taken_count, total_count}
    adherence_by_item: dict[str, dict] = {}
    for log in adherence_logs:
        key = str(log.item_id)
        if key not in adherence_by_item:
            adherence_by_item[key] = {"taken": 0, "total": 0}
        adherence_by_item[key]["total"] += 1
        if log.taken_at is not None:
            adherence_by_item[key]["taken"] += 1

    # Map each goal to supporting items
    goal_results = []
    for goal in goals:
        relevant_categories = GOAL_CATEGORY_MAP.get(goal, set())
        supporting_items: list[dict] = []

        for us in user_supplements:
            supplement = us.supplement
            # Match by category or direct goal tag
            matches_category = supplement.category and supplement.category.value in relevant_categories
            matches_goal = supplement.goals and goal in supplement.goals
            if matches_category or matches_goal:
                item_adherence = adherence_by_item.get(str(us.id), {"taken": 0, "total": 0})
                rate = item_adherence["taken"] / item_adherence["total"] if item_adherence["total"] > 0 else None
                supporting_items.append({
                    "id": str(us.id),
                    "name": supplement.name,
                    "type": "supplement",
                    "adherence_rate": round(rate, 2) if rate is not None else None,
                    "taken_count": item_adherence["taken"],
                    "total_count": item_adherence["total"],
                })

        for um in user_medications:
            # Medications support goals less directly — use category matching if available
            med = um.medication
            if hasattr(med, "category") and med.category and med.category in relevant_categories:
                item_adherence = adherence_by_item.get(str(um.id), {"taken": 0, "total": 0})
                rate = item_adherence["taken"] / item_adherence["total"] if item_adherence["total"] > 0 else None
                supporting_items.append({
                    "id": str(um.id),
                    "name": med.name,
                    "type": "medication",
                    "adherence_rate": round(rate, 2) if rate is not None else None,
                    "taken_count": item_adherence["taken"],
                    "total_count": item_adherence["total"],
                })

        # Goal-level adherence (average across supporting items)
        items_with_data = [i for i in supporting_items if i["adherence_rate"] is not None]
        goal_adherence = None
        if items_with_data:
            goal_adherence = round(
                sum(i["adherence_rate"] for i in items_with_data) / len(items_with_data), 2
            )

        # Journal correlation
        journal_metric = GOAL_JOURNAL_MAP.get(goal)
        journal_avg = None
        journal_trend: list[dict] = []
        if journal_metric:
            vals = []
            for entry in journal_entries:
                v = getattr(entry, journal_metric, None)
                if v is not None:
                    vals.append(v)
                    journal_trend.append({
                        "date": entry.entry_date.isoformat(),
                        "value": v,
                    })
            if vals:
                journal_avg = round(sum(vals) / len(vals), 1)

        goal_results.append({
            "goal": goal,
            "label": GOAL_LABELS.get(goal, goal.replace("_", " ").title()),
            "icon": GOAL_ICONS.get(goal, "star"),
            "item_count": len(supporting_items),
            "adherence_rate": goal_adherence,
            "supporting_items": supporting_items,
            "journal_metric": journal_metric,
            "journal_avg": journal_avg,
            "journal_trend": journal_trend,
        })

    return {
        "goals": goal_results,
        "has_preferences": True,
        "period_days": days,
        "start_date": start_date,
        "end_date": end_date,
    }
