import enum
import re


class Frequency(str, enum.Enum):
    daily = "daily"
    twice_daily = "twice_daily"
    three_times_daily = "three_times_daily"
    weekly = "weekly"
    every_other_day = "every_other_day"
    as_needed = "as_needed"


class TakeWindow(str, enum.Enum):
    morning_fasted = "morning_fasted"
    morning_with_food = "morning_with_food"
    midday = "midday"
    afternoon = "afternoon"
    evening = "evening"
    bedtime = "bedtime"


_TAKE_WINDOW_ALIASES = {
    "with_meals": TakeWindow.morning_with_food,
    "with_breakfast": TakeWindow.morning_with_food,
    "breakfast": TakeWindow.morning_with_food,
    "midday_with_food": TakeWindow.midday,
    "noon_with_food": TakeWindow.midday,
    "lunch_with_food": TakeWindow.midday,
    "with_lunch": TakeWindow.midday,
    "afternoon_with_food": TakeWindow.afternoon,
    "evening_with_food": TakeWindow.evening,
    "with_dinner": TakeWindow.evening,
    "dinner": TakeWindow.evening,
    "morning": TakeWindow.morning_with_food,
    "noon": TakeWindow.midday,
}


def _normalize_take_window_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def normalize_take_window(
    value: "TakeWindow | str | None",
    *,
    fallback: "TakeWindow | None" = None,
) -> "TakeWindow | None":
    if value is None:
        return fallback
    if isinstance(value, TakeWindow):
        return value

    normalized = _normalize_take_window_token(value)
    if not normalized:
        return fallback

    try:
        return TakeWindow(normalized)
    except ValueError:
        pass

    alias = _TAKE_WINDOW_ALIASES.get(normalized)
    if alias is not None:
        return alias

    if "fast" in normalized or "empty_stomach" in normalized:
        return TakeWindow.morning_fasted
    if "bedtime" in normalized or "sleep" in normalized:
        return TakeWindow.bedtime
    if "evening" in normalized or "dinner" in normalized:
        return TakeWindow.evening
    if "afternoon" in normalized:
        return TakeWindow.afternoon
    if "midday" in normalized or "noon" in normalized or "lunch" in normalized:
        return TakeWindow.midday
    if "meal" in normalized or "food" in normalized or "breakfast" in normalized or "morning" in normalized:
        return TakeWindow.morning_with_food

    return fallback


def take_window_requires_food(
    value: "TakeWindow | str | None",
    *,
    fallback: "TakeWindow | None" = None,
) -> bool:
    if isinstance(value, TakeWindow):
        return value == TakeWindow.morning_with_food

    if isinstance(value, str):
        normalized = _normalize_take_window_token(value)
        if any(token in normalized for token in ("meal", "food", "breakfast", "lunch", "dinner")):
            return True

    normalized_value = normalize_take_window(value, fallback=fallback)
    return normalized_value == TakeWindow.morning_with_food


class MuscleGroup(str, enum.Enum):
    chest = "chest"
    back = "back"
    shoulders = "shoulders"
    biceps = "biceps"
    triceps = "triceps"
    forearms = "forearms"
    quadriceps = "quadriceps"
    hamstrings = "hamstrings"
    glutes = "glutes"
    calves = "calves"
    core = "core"
    full_body = "full_body"
    cardio = "cardio"


class ExerciseCategory(str, enum.Enum):
    compound = "compound"
    isolation = "isolation"
    bodyweight = "bodyweight"
    cardio = "cardio"
    flexibility = "flexibility"
    plyometric = "plyometric"
    olympic = "olympic"


class ExerciseEquipment(str, enum.Enum):
    barbell = "barbell"
    dumbbell = "dumbbell"
    cable = "cable"
    machine = "machine"
    smith_machine = "smith_machine"
    bodyweight = "bodyweight"
    kettlebell = "kettlebell"
    resistance_band = "resistance_band"
    ez_bar = "ez_bar"
    trap_bar = "trap_bar"
    none = "none"


class WeekDay(str, enum.Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"
