"""Best-effort supplement import from the legacy Supplement_Stack workbook.

The workbook is an old `.xls` file and this repo does not currently ship the
usual `xlrd` dependency needed to parse it directly. For seeding purposes we
recover the visible workbook text via the local `strings` binary, extract the
main supplement list, then apply conservative cleanup and filtering rules.
"""

from __future__ import annotations

import logging
import re
import subprocess
from pathlib import Path


logger = logging.getLogger(__name__)

WORKBOOK_PATH = Path(__file__).resolve().parents[3] / "data" / "Supplement_Stack.xls"
_START_MARKER = "Supplement"
_END_MARKER = "Explanation*"

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


def _read_workbook_strings(workbook_path: Path) -> list[str]:
    try:
        result = subprocess.run(
            ["strings", "-n", "4", str(workbook_path)],
            check=True,
            capture_output=True,
            text=True,
            errors="ignore",
        )
    except FileNotFoundError:
        logger.warning("Skipping workbook supplement import because `strings` is not available")
        return []
    except subprocess.CalledProcessError as exc:
        logger.warning("Skipping workbook supplement import because `strings` failed: %s", exc)
        return []

    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _extract_candidate_lines(lines: list[str]) -> list[str]:
    try:
        start_idx = lines.index(_START_MARKER) + 1
    except ValueError:
        logger.warning("Supplement workbook import could not find start marker %r", _START_MARKER)
        return []

    try:
        end_idx = lines.index(_END_MARKER, start_idx)
    except ValueError:
        end_idx = len(lines)

    return lines[start_idx:end_idx]


def _normalize_candidate_name(raw_name: str) -> str | None:
    if raw_name in {_START_MARKER, "Supplements", "Peptides"}:
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
    if any(token in lowered for token in _DROP_SUBSTRINGS):
        return True

    return False


def _infer_category(name: str) -> str:
    lowered = name.lower()
    for category, keywords in _CATEGORY_RULES:
        if any(keyword in lowered for keyword in keywords):
            return category
    return "other"


def _infer_goals(category: str) -> list[str] | None:
    goals = _GOALS_BY_CATEGORY.get(category)
    return list(goals) if goals else None


def extract_workbook_supplement_names(workbook_path: Path = WORKBOOK_PATH) -> list[str]:
    lines = _read_workbook_strings(workbook_path)
    candidates = _extract_candidate_lines(lines)

    names: list[str] = []
    seen: set[str] = set()
    for raw_name in candidates:
        normalized = _normalize_candidate_name(raw_name)
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
    excluded_names = {name.lower() for name in (excluded_names or set())}

    catalog: list[dict] = []
    for name in extract_workbook_supplement_names(workbook_path):
        if name.lower() in excluded_names:
            continue

        category = _infer_category(name)
        catalog.append(
            {
                "name": name,
                "category": category,
                "form": None,
                "goals": _infer_goals(category),
                "mechanism_tags": None,
                "description": "Imported from the Supplement_Stack workbook.",
            }
        )

    return catalog
