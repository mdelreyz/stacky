"""Cross-references all active user items for known interactions.

Uses AI profiles (known_interactions field) from supplements and medications
to detect contraindications, cautions, and severity levels across the user's
entire active regimen.
"""

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class Interaction:
    item_a: str
    item_b: str
    interaction_type: str  # "contraindication" or "caution"
    severity: str  # "critical", "major", "moderate", "minor"
    description: str


def check_interactions(
    items: list[dict],
) -> list[Interaction]:
    """Check for interactions across a list of items.

    Each item dict should have:
        - name: str
        - ai_profile: dict | None (with optional 'known_interactions' list)
        - common_names: list[str] (alternative names for matching)
    """
    # Build a lookup of all item names (including common names / aliases)
    all_names: dict[str, str] = {}  # lowercase alias → canonical name
    for item in items:
        canonical = item["name"]
        all_names[canonical.lower()] = canonical
        for alias in item.get("common_names", []):
            all_names[alias.lower()] = canonical

    interactions: list[Interaction] = []
    seen_pairs: set[tuple[str, str]] = set()

    for item in items:
        profile = item.get("ai_profile")
        if not profile or not isinstance(profile, dict):
            continue

        known = profile.get("known_interactions", [])
        if not isinstance(known, list):
            continue

        item_name = item["name"]

        for interaction in known:
            if not isinstance(interaction, dict):
                continue

            substance = interaction.get("substance", "")
            substance_lower = substance.lower()

            # Check if this substance matches any item in the user's active regimen
            matched_name = all_names.get(substance_lower)
            if matched_name is None:
                # Try partial matching for common patterns
                for alias, canonical in all_names.items():
                    if substance_lower in alias or alias in substance_lower:
                        matched_name = canonical
                        break

            if matched_name is None or matched_name == item_name:
                continue

            # Deduplicate: only report A↔B once, not A→B and B→A
            pair = tuple(sorted([item_name, matched_name]))
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            interactions.append(
                Interaction(
                    item_a=item_name,
                    item_b=matched_name,
                    interaction_type=interaction.get("type", "caution"),
                    severity=interaction.get("severity", "moderate"),
                    description=interaction.get("description", f"Known interaction between {item_name} and {matched_name}"),
                )
            )

    # Sort by severity: critical > major > moderate > minor
    severity_order = {"critical": 0, "major": 1, "moderate": 2, "minor": 3}
    interactions.sort(key=lambda i: severity_order.get(i.severity, 4))

    return interactions


def build_item_dicts_for_checking(
    *,
    supplements: list | None = None,
    medications: list | None = None,
    peptides: list | None = None,
) -> list[dict]:
    """Convert ORM objects into dicts suitable for check_interactions()."""
    items: list[dict] = []

    for s in (supplements or []):
        catalog = s.supplement if hasattr(s, "supplement") else s
        profile = getattr(catalog, "ai_profile", None)
        common_names = []
        if profile and isinstance(profile, dict):
            common_names = profile.get("common_names", [])
        items.append({
            "name": catalog.name,
            "ai_profile": profile,
            "common_names": common_names,
            "category": getattr(catalog, "category", None),
            "goals": getattr(catalog, "goals", None) or [],
        })

    for m in (medications or []):
        catalog = m.medication if hasattr(m, "medication") else m
        profile = getattr(catalog, "ai_profile", None)
        common_names = []
        if profile and isinstance(profile, dict):
            common_names = profile.get("common_names", [])
        items.append({
            "name": catalog.name,
            "ai_profile": profile,
            "common_names": common_names,
            "category": getattr(catalog, "category", None),
            "goals": getattr(catalog, "goals", None) or [],
        })

    for p in (peptides or []):
        catalog = p.peptide if hasattr(p, "peptide") else p
        profile = getattr(catalog, "ai_profile", None)
        common_names = []
        if profile and isinstance(profile, dict):
            common_names = profile.get("common_names", [])
        items.append({
            "name": catalog.name,
            "ai_profile": profile,
            "common_names": common_names,
            "category": getattr(catalog, "category", None),
            "goals": getattr(catalog, "goals", None) or [],
        })

    return items
