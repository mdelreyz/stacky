# Catalog Modality Audit

Date: 2026-04-10

This audit was derived from `apps/api/data/manual_catalog_profiles.json` after the manual local profile pass reached full coverage for the shared supplement catalog.

Purpose:
- identify rows that are not clean supplement entries
- define likely target catalogs for mirror or migration work
- keep future cleanup compatible with the current app behavior

## Snapshot

- Total profiled supplement-catalog rows: `305`
- Plain supplement rows: `193`
- Non-plain rows requiring some semantic caution: `112`

Current rule of thumb:
- `mirror` first when a row needs to appear in a better catalog but existing supplement flows still depend on it
- `migrate` only after the frontend, recommendation engine, and onboarding flows stop assuming the row lives solely in `supplements`

## Highest-Confidence Target Catalog Candidates

### Peptide Catalog

These are not credible long-term supplement-catalog residents.

| Name | Why |
|------|-----|
| `HGH` | Explicitly stored as `prescription_hormone_therapy_like`; belongs with peptide/hormone treatment workflows, not supplement onboarding. |

### Medication Catalog

These are the strongest medication-like candidates and should be reviewed first for shared-medication catalog mirroring.

| Name | Why |
|------|-----|
| `Daosin` | Condition-targeted enzyme support with medication-style use semantics. |
| `Emoxypine Succinate (Mexidol, Mexicor, and Armadin Long)` | Synthetic medication-like antioxidant/neuroprotective row. |
| `Lithium` | Explicit medication-like framing; not a normal supplement-catalog primitive. |
| `Lithium (Low-Dose)` | Same issue as above, even if the use case is softer. |
| `Lumbrokinase` | Strong medication-adjacent anticoagulation-style semantics. |
| `Methylene Blue` | Clear medication-like / experimental clinical compound behavior. |
| `Nattokinase` | Medication-adjacent fibrinolytic behavior and interaction profile. |
| `Piracetam/Aniracetam` | Synthetic racetam row; belongs outside supplement semantics. |
| `Potassium iodine` | Precision iodide / emergency-use semantics make this medication-adjacent. |
| `Selbex/ Teprenone` | Branded medication-style GI mucosal support entry. |
| `St John's Wort` | Strong interaction surface and medication-like behavior. |
| `St. John's Wort` | Same as above; alias should likely resolve to one canonical medication row. |
| `TUDCA` | Bile-acid style compound with medication-adjacent handling. |
| `TUDCA (Tauroursodeoxycholic Acid)` | Alias/expanded-name medication-like row. |

### Medication Catalog Review Queue

These are still plausible supplements in some user mental models, but they already carry precision or hormone semantics that warrant a second-pass catalog decision.

| Name | Why |
|------|-----|
| `DHEA` | Hormone-like rather than ordinary supplement-like. |
| `Melatonin` | Stored as `hormone_therapy_like`; may deserve cross-catalog treatment. |
| `Potassium Citrate` | Precision electrolyte product rather than casual wellness entry. |
| `Proferrin` | Iron-focused precision product with clinical-style use cases. |
| `Iodine` | Precision-mineral semantics; review whether supplement-only is sufficient. |
| `Iron` | Precision-mineral semantics; review whether supplement-only is sufficient. |
| `Selenium` | Precision-mineral semantics; likely stays, but should be intentionally classified. |
| `Zinc Picolinate` | Precision-mineral semantics; likely stays, but should be intentionally classified. |
| `Vitamin A (Retinol)` | Precision-vitamin semantics and toxicity ceiling. |
| `Vitamin D3` | Precision-vitamin semantics; may warrant stronger cross-catalog safety handling. |
| `Vitamin K2 (MK-7)` | Precision-vitamin semantics with drug-interaction relevance. |
| `Vitamin K2 MK-7` | Same as above; alias consolidation needed. |

### Therapy Catalog

| Name | Why |
|------|-----|
| `GR7 / Redenhair` | Hair-care / cosmetic support entry, not a real supplement row. Best fit is the shared therapy catalog under a haircare bucket. |

## Not Immediate Migration Targets, But Not Clean Supplements Either

These groups should stay visible in the cleanup plan even if they do not move first.

### Food-Based Entries

These are foods or food-pattern supports, not supplements:

- `Grapefruit`
- `Lemon/lime juice`
- `MCT`
- `MCT Oil`
- `Manuka Honey`
- `Matcha`
- `Olives and olive oil: hydroxytyrosol, oleic acid`
- `Selenium (Brazil nuts)`
- `Spirulina`
- `Whey Protein`

### Brand / Formula Entries

These are branded blends, proprietary formulas, or commercially named families and may eventually need a separate formula-product strategy:

- `Kos Greens Powders`
- `LKM5`
- `MAPs`
- `Myc-P`
- `Oxaloacetate (BenaGene)`
- `Protandim`
- `Scutell'up`
- `StemRegen Release`
- `Timeline`
- `Vivia`
- `Viviscal`
- `vinia`

### Grouped / Mixed Protocol Entries

These are not single ingredients and should eventually be split, normalized, or hidden behind canonical component rows:

- `L-carnitine (+ Acetyl-L) 3 g/day`
- `Lactoferrin / colostrumamide`
- `Liposomal Cinnamon, Clove, and Oregano Oil Combination`
- `Methylated vitamin B complex + Betaine`
- `Multimineral and Antioxidant supplement`
- `Omega 3 (EPA/DHA) + Ox Bile + Olive Oil/Butter`
- `Probiotics, fermented foods`
- `Shiitake / Maitake`
- `Thyroid supplement foti`
- `Vit D3/K3/A/E`
- `Yerba mate / Guayusa Tea`

## Next Actions

### Already Applied Locally

The first mirror-first batch has already been synced into the local shared catalogs through `apps/api/scripts/apply_catalog_modality_mirrors.py`:

- `HGH` -> `peptides`
- `GR7 / Redenhair` -> `therapies`
- `Daosin` -> `medications`
- `Emoxypine Succinate (Mexidol, Mexicor, and Armadin Long)` -> `medications`
- `Piracetam/Aniracetam` -> `medications`
- `Potassium iodine` -> `medications`
- `Selbex/ Teprenone` -> `medications`

### Next Actions

1. Extend the mirror file with the next medication-like tranche after alias review.
2. Add canonical-alias handling for obvious duplicates like `St John's Wort` / `St. John's Wort` and `TUDCA` / `TUDCA (Tauroursodeoxycholic Acid)`.
3. Decide whether `DHEA`, `Melatonin`, and precision-mineral / precision-vitamin rows stay supplement-primary or get cross-catalog treatment.
4. Decide whether food-based and brand-formula rows stay in supplements with badges or get their own future catalog treatment.
