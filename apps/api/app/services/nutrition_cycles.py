from datetime import date, timedelta
from typing import TypedDict

from app.models.nutrition_cycle import NutritionCycle


class NutritionPhaseState(TypedDict):
    index: int
    phase: dict
    phase_start: date
    next_transition: date


def _phase_duration_days(phase: dict) -> int:
    try:
        duration = int(phase.get("duration_days", 1))
    except (TypeError, ValueError):
        return 1
    return max(duration, 1)


def phase_state_for_date(
    cycle: NutritionCycle,
    target_date: date,
    *,
    include_future: bool = False,
) -> NutritionPhaseState | None:
    phases = cycle.phases or []
    if not phases:
        return None

    if target_date < cycle.phase_started_at:
        if not include_future:
            return None

        first_phase = phases[0]
        return {
            "index": 0,
            "phase": first_phase,
            "phase_start": cycle.phase_started_at,
            "next_transition": cycle.phase_started_at + timedelta(days=_phase_duration_days(first_phase)),
        }

    total_duration = sum(_phase_duration_days(phase) for phase in phases)
    days_since_start = (target_date - cycle.phase_started_at).days
    cycle_day = days_since_start % total_duration
    iteration_start = target_date - timedelta(days=cycle_day)
    cursor = iteration_start
    remaining_days = cycle_day

    for index, phase in enumerate(phases):
        duration_days = _phase_duration_days(phase)
        if remaining_days < duration_days:
            return {
                "index": index,
                "phase": phase,
                "phase_start": cursor,
                "next_transition": cursor + timedelta(days=duration_days),
            }

        remaining_days -= duration_days
        cursor += timedelta(days=duration_days)

    last_phase = phases[-1]
    return {
        "index": len(phases) - 1,
        "phase": last_phase,
        "phase_start": cursor - timedelta(days=_phase_duration_days(last_phase)),
        "next_transition": cursor,
    }


def sync_nutrition_cycle(cycle: NutritionCycle, reference_date: date) -> None:
    state = phase_state_for_date(cycle, reference_date, include_future=True)
    if state is None:
        return

    cycle.current_phase_idx = state["index"]
    cycle.next_transition = state["next_transition"]


def serialize_active_nutrition_phase(cycle: NutritionCycle, target_date: date) -> dict | None:
    state = phase_state_for_date(cycle, target_date)
    if state is None:
        return None

    phase = state["phase"]
    return {
        "plan_name": cycle.name,
        "cycle_type": cycle.cycle_type,
        "current_phase_idx": state["index"],
        "total_phases": len(cycle.phases or []),
        "next_transition": state["next_transition"],
        "days_until_transition": (state["next_transition"] - target_date).days,
        "name": phase.get("name") or f"Phase {state['index'] + 1}",
        "duration_days": _phase_duration_days(phase),
        "macro_profile": phase.get("macro_profile"),
        "pattern": phase.get("pattern"),
        "restrictions": phase.get("restrictions") or [],
        "notes": phase.get("notes"),
    }


def nutrition_cycle_alert(cycle: NutritionCycle, target_date: date) -> dict | None:
    if len(cycle.phases or []) < 2:
        return None

    state = phase_state_for_date(cycle, target_date)
    if state is None:
        return None

    days_until_transition = (state["next_transition"] - target_date).days
    if days_until_transition > 3:
        return None

    next_phase = cycle.phases[(state["index"] + 1) % len(cycle.phases)]
    next_phase_name = next_phase.get("name") or f"Phase {((state['index'] + 1) % len(cycle.phases)) + 1}"
    suffix = "" if days_until_transition == 1 else "s"

    return {
        "item_name": cycle.name,
        "message": f"Transition to {next_phase_name} in {days_until_transition} day{suffix}.",
        "days_until_transition": days_until_transition,
    }
