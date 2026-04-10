"""Supplement import from the Supplement_Stack workbook.

Parses the ``data/Supplement_Stack.xls`` file using ``pandas`` + ``xlrd``,
extracts the "Supplements" sheet, and produces a clean catalog of dicts
suitable for seeding the database.

Each dict has keys: name, category, form, goals, mechanism_tags, description.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

try:
    import pandas as pd

    _HAS_PANDAS = True
except ImportError:  # pragma: no cover
    pd = None  # type: ignore[assignment]
    _HAS_PANDAS = False


logger = logging.getLogger(__name__)

WORKBOOK_PATH = Path(__file__).resolve().parents[3] / "data" / "Supplement_Stack.xls"

# ---------------------------------------------------------------------------
# Name normalisation
# ---------------------------------------------------------------------------

_RAW_REPLACEMENTS = {
    "5HTP": "5-HTP",
    "AG1/": "AG1 Greens Powder",
    "Anthocyanins (blueberries, a": "Anthocyanins",
    "Aspirine": "Aspirin",
    "Artemisin": "Artemisinin",
    "Bacopa Monierri": "Bacopa Monnieri",
    "Chromium6": "Chromium",
    "Collagen Peptides2": "Collagen Peptides",
    "Horney Goat Weed": "Horny Goat Weed",
    "Keratine": "Keratin",
    "L-citrullin malat": "L-Citrulline Malate",
    "Lemon balm6": "Lemon Balm",
    "LKM512,": "LKM512",
    "Manuca Honey": "Manuka Honey",
    "Niacin B3": "Niacin (Vitamin B3)",
    "Rhodeola Rosea": "Rhodiola Rosea",
    "Sodium Butyrate1": "Sodium Butyrate",
    "Stinging neetle(": "Stinging Nettle",
    "ValerianJ": "Valerian",
    "Vitamin K2-MK4 and MK7": "Vitamin K2 MK-4 / MK-7",
}

# ---------------------------------------------------------------------------
# Exclusion lists (medications / drugs that don't belong in the supplement
# catalog)
# ---------------------------------------------------------------------------

_DROP_EXACT = {
    "Bioidentical testosterone cream/pellets",
    "Canaglifozin (Invokana) (SGLT2 inhibitor)",
    "Captopril",
    "Deprenyl",
    "EDTA suppositories/IV",
    "Estradiol (17alpha-estradiol)",
    "Flozins (SGLT2 inhibitors)",
    "Hydralazine / if high blood pressure specially good",
    "Ivabradine",
    "Meclizine",
    "Metformin",
    "Modafinil",
    "NAD+ (IV / intramuscular 50 mg)",
    "Nicotine (in patches or gums)",
    "Oxytocin (nose spray)",
    "Pentoxifylline",
    "Pioglitazone",
    "Rapamycin",
    "Rilmenedine",
    "Serotonine",
    "Statins (Rosuvastatin/Monacolin K/red yeast rice)",
    "Verapamil",
    "Wensin Keli",
}

_DROP_SUBSTRINGS = (
    "inhibitor",
    "intramuscular",
    "nose spray",
    "suppositories",
    "/iv",
    "cream/pellets",
)

# ---------------------------------------------------------------------------
# Category inference
# ---------------------------------------------------------------------------

_CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("healthy_aging", ("spermidine", "fisetin", "ergothioneine", "pterostilbene", "oxaloacetate", "alpha ketoglutarate", "superoxide dismutase", "catalase", "trehalose", "piperlongumine")),
    ("energy_mitochondria", ("creatine", "coenzyme q10", "ubiquinol", "mitoq", "d-ribose", "mct", "molecular h2", "shilajit", "cordyceps", "beta alanine", "whey protein")),
    ("brain_mood_stress", ("theanine", "alpha-gpc", "rhodiola", "bacopa", "lion's mane", "huperzine", "ginkgo", "phosphatidylserine", "l-tyrosine", "panax ginseng", "saffron", "holy basil", "reishi", "sage", "rosemary", "gaba", "phenylethylamine")),
    ("sleep_recovery", ("melatonin", "5-htp", "tryptophan", "glycine", "valerian", "apigenin", "lemon balm", "magnesium taureate")),
    ("cardiovascular", ("bergamot", "hawthorn", "nattokinase", "black garlic", "allicin", "terminalia arjuna", "omega-7")),
    ("glucose_metabolic", ("berberine", "inulin", "apple vinegar", "chromium", "myo-inositol", "oleoylethanolamide", "cinnamon")),
    ("gut_digestion", ("probiotics", "acacia fiber", "butyrate", "resistant starch", "lactospore", "lkm512", "lactoferrin", "psyllium", "inulin")),
    ("detox_binding", ("activated charcoal", "chlorella", "milk thistle", "dandelion", "modified citrus pectin")),
    ("immune_antimicrobial", ("quercetin", "vitamin c", "elderberry", "astragalus", "olive leaf", "cat's claw", "cryptolepis", "sida acuta", "artemisinin", "lactoferrin", "houttuynia")),
    ("inflammation_antioxidant", ("curcumin", "anthocyanins", "astaxanthin", "bilberry", "black seed oil", "ginger", "grape seed", "op c", "opc", "manuka honey", "japanese knotweed", "rutin", "delphinidin")),
    ("hormones_fertility", ("ashwagandha", "biotin", "boron", "iodine", "maca", "tongkat ali", "horny goat weed", "chasteberry", "saw palmetto", "keratin", "viviscal", "dhea")),
    ("musculoskeletal", ("collagen", "glucosamine", "chondroitin", "hyaluronic acid", "msm", "cissus", "lysine", "carnosine")),
]

_GOALS_BY_CATEGORY = {
    "healthy_aging": ["longevity"],
    "energy_mitochondria": ["energy"],
    "brain_mood_stress": ["cognitive", "stress"],
    "sleep_recovery": ["sleep"],
    "cardiovascular": ["longevity"],
    "glucose_metabolic": ["weight_management"],
    "gut_digestion": ["gut_health"],
    "immune_antimicrobial": ["immunity"],
    "inflammation_antioxidant": ["longevity"],
    "hormones_fertility": ["hair"],
    "musculoskeletal": ["joint_health"],
}

_MAIN_USE_TO_CATEGORY = {
    "General Longevity": "healthy_aging",
    "Cardiovascular": "cardiovascular",
    "Cognitive": "brain_mood_stress",
    "Mitochondria": "energy_mitochondria",
    "Gut": "gut_digestion",
    "Antioxidant": "inflammation_antioxidant",
    "Performance": "energy_mitochondria",
    "Hormonal": "hormones_fertility",
    "Joints/Hair/Skin/Bones": "musculoskeletal",
    "Lyme": "immune_antimicrobial",
    "Glucose": "glucose_metabolic",
    "Immune System": "immune_antimicrobial",
    "Sleep": "sleep_recovery",
    "General": "other",
    "Anti-inflammation": "inflammation_antioxidant",
    "Regeneration": "healthy_aging",
    "Detox": "detox_binding",
    "Binders": "detox_binding",
    "Senolytic": "healthy_aging",
    "Adaptogen": "brain_mood_stress",
    "Grey Hair": "hormones_fertility",
    "Pulse": "other",
    "Fertility": "hormones_fertility",
    "Stress": "brain_mood_stress",
    "Gut (bioavailability)": "gut_digestion",
    "Eye": "inflammation_antioxidant",
}

# Timing strings that hint at extra goals.
_TIMING_GOAL_HINTS: dict[str, list[str]] = {
    "before sport": ["performance"],
    "post-workout": ["performance"],
    "before performance": ["performance"],
    "just before bed": ["sleep"],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_str(value: object) -> str | None:
    """Return a stripped string or ``None`` for NaN / empty values."""
    if value is None:
        return None
    if _HAS_PANDAS and pd.isna(value):  # type: ignore[arg-type]
        return None
    text = str(value).strip()
    return text if text else None


def _normalize_candidate_name(raw_name: str) -> str | None:
    """Clean up a supplement name extracted from the workbook."""
    if raw_name in {"Supplement", "Supplements", "Peptides"}:
        return None

    raw_name = raw_name.strip()
    if not raw_name:
        return None

    raw_name = _RAW_REPLACEMENTS.get(raw_name, raw_name)
    raw_name = re.sub(r"\s+", " ", raw_name).strip()
    raw_name = re.sub(r"[\*'`/&]+$", "", raw_name).strip()
    raw_name = re.sub(r"(?<![A-Z])\d+$", "", raw_name).strip()
    raw_name = raw_name.rstrip(" -,/").strip()

    if len(raw_name) < 3:
        return None
    if any(char in raw_name for char in ('"', "$", "=")):
        return None
    if raw_name in {"Omega", "Explanation"}:
        return None

    return raw_name


def _should_drop_candidate(name: str) -> bool:
    if name in _DROP_EXACT:
        return True

    lowered = name.lower()
    return any(token in lowered for token in _DROP_SUBSTRINGS)


def _infer_category(name: str, main_use: str | None = None) -> str:
    """Determine the body-system category for a supplement.

    Priority: keyword rules first (most precise), then ``Main Use`` column
    from the workbook as a fallback.
    """
    lowered = name.lower()
    for category, keywords in _CATEGORY_RULES:
        if any(keyword in lowered for keyword in keywords):
            return category

    # Fall back to Main Use column mapping.
    if main_use:
        mapped = _MAIN_USE_TO_CATEGORY.get(main_use)
        if mapped:
            return mapped

    return "other"


def _infer_goals(category: str, general_timing: str | None = None) -> list[str] | None:
    """Return default goals for the category, enriched by timing hints."""
    base = list(_GOALS_BY_CATEGORY.get(category, []))

    if general_timing:
        timing_lower = general_timing.lower()
        for pattern, extra_goals in _TIMING_GOAL_HINTS.items():
            if pattern in timing_lower:
                for g in extra_goals:
                    if g not in base:
                        base.append(g)

    return base if base else None


def _infer_mechanism_tags(
    main_use: str | None,
    tier: str | None,
    general_timing: str | None,
) -> list[str] | None:
    """Derive lightweight mechanism tags from workbook metadata."""
    tags: list[str] = []

    if main_use:
        main_lower = main_use.lower()
        if "senolytic" in main_lower:
            tags.append("senolytic")
        if "adaptogen" in main_lower:
            tags.append("adaptogen")
        if "antioxidant" in main_lower:
            tags.append("antioxidant")
        if "detox" in main_lower or "binder" in main_lower:
            tags.append("detox / binder")

    if tier:
        tier_lower = tier.lower()
        if "pulse" in tier_lower:
            tags.append("pulsed dosing")
        if "binder" in tier_lower:
            if "detox / binder" not in tags:
                tags.append("detox / binder")

    if general_timing:
        timing_lower = general_timing.lower()
        if "sport" in timing_lower or "workout" in timing_lower:
            tags.append("performance")

    return tags if tags else None


def _build_description(
    *,
    main_use: str | None,
    consensus_dosage: str | None,
    general_timing: str | None,
    warning: str | None,
    bioavailability: str | None,
    note: str | None,
) -> str:
    """Assemble a rich description from the available workbook columns."""
    parts: list[str] = []

    if main_use:
        parts.append(f"{main_use}.")

    if consensus_dosage:
        parts.append(f"Dosage: {consensus_dosage}.")

    if general_timing:
        parts.append(f"Timing: {general_timing}.")

    if bioavailability:
        parts.append(f"Bioavailability: {bioavailability}.")

    if warning:
        parts.append(f"Warning: {warning}.")

    if note:
        parts.append(f"Note: {note}.")

    parts.append("Imported from the Supplement_Stack workbook.")

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Workbook reading (pandas + xlrd)
# ---------------------------------------------------------------------------


def _read_supplement_dataframe(
    workbook_path: Path,
) -> "pd.DataFrame | None":
    """Read the Supplements sheet and return a DataFrame, or None on failure."""
    if not _HAS_PANDAS:
        logger.warning(
            "Skipping workbook supplement import — pandas is not installed"
        )
        return None

    if not workbook_path.exists():
        logger.warning(
            "Skipping workbook supplement import — file not found: %s",
            workbook_path,
        )
        return None

    try:
        df = pd.read_excel(  # type: ignore[union-attr]
            workbook_path,
            sheet_name="Supplements",
            engine="xlrd",
        )
    except Exception as exc:
        logger.warning(
            "Skipping workbook supplement import — failed to read Excel: %s",
            exc,
        )
        return None

    if "Supplement" not in df.columns:
        logger.warning(
            "Skipping workbook supplement import — 'Supplement' column not found"
        )
        return None

    return df


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def extract_workbook_supplement_names(
    workbook_path: Path = WORKBOOK_PATH,
) -> list[str]:
    """Return a deduplicated list of clean supplement names from the workbook."""
    df = _read_supplement_dataframe(workbook_path)
    if df is None:
        return []

    names: list[str] = []
    seen: set[str] = set()

    for raw_name in df["Supplement"]:
        if _safe_str(raw_name) is None:
            continue

        normalized = _normalize_candidate_name(str(raw_name).strip())
        if normalized is None or _should_drop_candidate(normalized):
            continue
        if normalized in seen:
            continue
        seen.add(normalized)
        names.append(normalized)

    return names


def load_workbook_supplement_catalog(
    workbook_path: Path = WORKBOOK_PATH,
    excluded_names: set[str] | None = None,
) -> list[dict]:
    """Load enriched supplement catalog entries from the workbook.

    Returns a list of dicts with keys:
        name, category, form, goals, mechanism_tags, description
    """
    excluded_lower = {name.lower() for name in (excluded_names or set())}

    df = _read_supplement_dataframe(workbook_path)
    if df is None:
        return []

    catalog: list[dict] = []
    seen: set[str] = set()

    for _, row in df.iterrows():
        raw_name = _safe_str(row.get("Supplement"))
        if raw_name is None:
            continue

        normalized = _normalize_candidate_name(raw_name)
        if normalized is None or _should_drop_candidate(normalized):
            continue
        if normalized in seen:
            continue
        if normalized.lower() in excluded_lower:
            continue

        seen.add(normalized)

        # Extract workbook metadata.
        main_use = _safe_str(row.get("Main Use"))
        # Strip trailing whitespace from Main Use (e.g. "Fertility " → "Fertility").
        if main_use:
            main_use = main_use.strip()
        consensus_dosage = _safe_str(row.get("Consensus Dosage"))
        general_timing = _safe_str(row.get("General_timing"))
        warning = _safe_str(row.get("Warning"))
        bioavailability = _safe_str(row.get("Bioavailability"))
        note = _safe_str(row.get("Note"))
        tier = _safe_str(row.get("Tier"))

        category = _infer_category(normalized, main_use=main_use)

        catalog.append(
            {
                "name": normalized,
                "category": category,
                "form": None,
                "goals": _infer_goals(category, general_timing=general_timing),
                "mechanism_tags": _infer_mechanism_tags(
                    main_use=main_use, tier=tier, general_timing=general_timing,
                ),
                "description": _build_description(
                    main_use=main_use,
                    consensus_dosage=consensus_dosage,
                    general_timing=general_timing,
                    warning=warning,
                    bioavailability=bioavailability,
                    note=note,
                ),
            }
        )

    return catalog
