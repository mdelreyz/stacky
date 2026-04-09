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
