import enum


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
