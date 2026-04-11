"""Seed the database with common supplements and their AI profiles."""
# ruff: noqa: I001
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, select

# Add the api directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import Base, async_session_factory, engine
from app.models.exercise import Exercise
from app.models.medication import Medication
from app.models.peptide import Peptide
from app.models.supplement import Supplement
from app.models.therapy import Therapy
from scripts.apply_catalog_modality_mirrors import apply_mirrors
from scripts.apply_manual_catalog_profiles import apply_entries as apply_manual_catalog_profiles
from scripts.seed_exercise_catalog import EXERCISE_CATALOG
from scripts.import_supplement_stack_xls import load_workbook_supplement_catalog
from scripts.seed_supplement_catalog import SUPPLEMENT_CATALOG


SUPPLEMENTS = [
    {
        "name": "Vitamin D3",
        "category": "immune_antimicrobial",
        "form": "softgel",
        "goals": ["bone health", "immunity"],
        "mechanism_tags": [],
        "description": "Essential fat-soluble vitamin for bone health, immunity, and mood regulation.",
        "ai_profile": {
            "common_names": ["Vitamin D3", "Cholecalciferol", "Vitamin D"],
            "category": "immune_antimicrobial",
            "mechanism_of_action": "Converted to calcidiol (25-OH-D) in the liver, then to calcitriol (1,25-dihydroxyvitamin D) in the kidneys. Calcitriol acts as a hormone, binding to vitamin D receptors (VDR) in nearly every cell, regulating calcium absorption, immune function, and gene expression.",
            "typical_dosages": [
                {"amount": 2000, "unit": "IU", "frequency": "daily", "context": "maintenance"},
                {"amount": 5000, "unit": "IU", "frequency": "daily", "context": "deficiency_correction"},
                {"amount": 10000, "unit": "IU", "frequency": "daily", "context": "severe_deficiency_short_term"},
            ],
            "forms": ["softgel", "capsule", "liquid_drops", "tablet"],
            "bioavailability": {
                "notes": "Fat-soluble — absorption increases 50% when taken with a fat-containing meal. D3 (cholecalciferol) is 87% more potent than D2 (ergocalciferol) at raising serum 25(OH)D.",
                "enhancers": ["fat_source", "vitamin_k2"],
                "inhibitors": ["fiber_supplements", "orlistat"],
            },
            "half_life": {"hours": "~480 (about 2-3 weeks)", "notes": "Very long half-life allows weekly dosing as an alternative to daily."},
            "timing_recommendations": {
                "preferred_windows": ["morning_with_food"],
                "avoid_windows": ["bedtime"],
                "with_food": True,
                "food_interactions": "Take with a meal containing fat (eggs, avocado, nuts). Avoid taking with high-fiber meals which can reduce absorption.",
                "notes": "Some evidence suggests evening dosing may disrupt melatonin production. Morning dosing preferred.",
            },
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "No cycling needed — daily supplementation is standard. Monitor blood levels (25-OH-D) every 6-12 months."},
            "known_interactions": [
                {"substance": "thiazide_diuretics", "type": "caution", "severity": "moderate", "description": "Both increase calcium levels; monitor for hypercalcemia."},
                {"substance": "statins", "type": "caution", "severity": "minor", "description": "Some statins may reduce vitamin D levels; supplementation may help."},
            ],
            "synergies": [
                {"substance": "Vitamin K2", "benefit": "Directs calcium to bones instead of arteries", "mechanism": "K2 activates osteocalcin (bone building) and matrix GLA protein (prevents arterial calcification)."},
                {"substance": "Magnesium", "benefit": "Required for vitamin D metabolism", "mechanism": "Magnesium is a cofactor in vitamin D conversion. Deficiency can impair D activation."},
            ],
            "contraindications": ["hypercalcemia", "sarcoidosis", "severe_kidney_disease"],
            "side_effects": ["nausea_at_high_doses", "hypercalcemia_with_excess", "kidney_stones_rare"],
            "safety_notes": "Generally very safe. Toxicity is rare below 10,000 IU/day. Test 25(OH)D levels — target 40-60 ng/mL.",
            "evidence_quality": "strong",
            "sources_summary": "Extensive RCT evidence. Holick 2007 (NEJM), Martineau 2017 (BMJ meta-analysis on respiratory infections).",
        },
    },
    {
        "name": "Magnesium Glycinate",
        "category": "sleep_recovery",
        "form": "capsule",
        "goals": ["sleep", "stress"],
        "mechanism_tags": ["neuroprotective"],
        "description": "Highly bioavailable form of magnesium chelated with glycine. Supports sleep, muscle relaxation, and stress reduction.",
        "ai_profile": {
            "common_names": ["Magnesium Glycinate", "Magnesium Bisglycinate", "Chelated Magnesium"],
            "category": "sleep_recovery",
            "mechanism_of_action": "Magnesium is a cofactor in 600+ enzymatic reactions. Glycinate form provides the amino acid glycine, which has calming effects via NMDA receptor modulation. Supports GABA activity, ATP production, and muscle/nerve function.",
            "typical_dosages": [
                {"amount": 200, "unit": "mg", "frequency": "daily", "context": "general_supplementation"},
                {"amount": 400, "unit": "mg", "frequency": "daily", "context": "sleep_and_relaxation"},
                {"amount": 600, "unit": "mg", "frequency": "daily", "context": "deficiency_correction"},
            ],
            "forms": ["capsule", "tablet", "powder"],
            "bioavailability": {"notes": "Glycinate is one of the most bioavailable forms (superior to oxide, comparable to citrate). Less likely to cause GI issues than other forms.", "enhancers": ["vitamin_b6"], "inhibitors": ["calcium_supplements", "high_dose_zinc", "phytic_acid"]},
            "half_life": {"hours": "~12-24", "notes": "Renal excretion. Body stores ~25g, half in bones."},
            "timing_recommendations": {
                "preferred_windows": ["evening", "bedtime"],
                "avoid_windows": [],
                "with_food": False,
                "food_interactions": "Can be taken with or without food. The glycine component may enhance sleep if taken at bedtime.",
                "notes": "Evening/bedtime dosing leverages glycine's calming effect. Split doses if taking >400mg.",
            },
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "No cycling needed. Most people are chronically deficient. Daily use is safe long-term."},
            "known_interactions": [
                {"substance": "antibiotics_tetracycline", "type": "caution", "severity": "moderate", "description": "Magnesium chelates tetracycline/fluoroquinolone antibiotics, reducing their absorption. Separate by 2-4 hours."},
                {"substance": "bisphosphonates", "type": "caution", "severity": "moderate", "description": "May reduce absorption of bisphosphonate drugs. Separate by 2 hours."},
            ],
            "synergies": [
                {"substance": "Vitamin D3", "benefit": "Required cofactor for vitamin D metabolism", "mechanism": "Mg is needed to convert vitamin D to its active form. Supplementing both optimizes D status."},
                {"substance": "Vitamin B6", "benefit": "Enhanced magnesium cellular uptake", "mechanism": "B6 facilitates magnesium transport into cells."},
                {"substance": "Zinc", "benefit": "Complementary mineral support", "mechanism": "Both commonly deficient; work synergistically in immune function. Take at different times to avoid competition."},
            ],
            "contraindications": ["severe_kidney_disease", "myasthenia_gravis", "heart_block"],
            "side_effects": ["loose_stools_at_high_doses", "drowsiness"],
            "safety_notes": "Very safe. Upper limit is 350mg from supplements (though food intake adds more). Glycinate form is gentlest on GI.",
            "evidence_quality": "strong",
            "sources_summary": "Abbasi 2012 (magnesium and sleep), Boyle 2017 (systematic review of Mg and anxiety).",
        },
    },
    {
        "name": "Omega-3 Fish Oil",
        "category": "cardiovascular",
        "form": "softgel",
        "goals": ["cognitive", "joints"],
        "mechanism_tags": ["anti-inflammatory"],
        "description": "Essential fatty acids EPA and DHA for cardiovascular health, brain function, and inflammation reduction.",
        "ai_profile": {
            "common_names": ["Omega-3", "Fish Oil", "EPA/DHA"],
            "category": "cardiovascular",
            "mechanism_of_action": "EPA and DHA incorporate into cell membranes, modulating inflammation via prostaglandin/leukotriene pathways. EPA resolves inflammation; DHA is critical for brain structure and neuronal signaling.",
            "typical_dosages": [
                {"amount": 1000, "unit": "mg", "frequency": "daily", "context": "general_health_combined_epa_dha"},
                {"amount": 2000, "unit": "mg", "frequency": "daily", "context": "inflammation_reduction"},
                {"amount": 3000, "unit": "mg", "frequency": "daily", "context": "triglyceride_lowering"},
            ],
            "forms": ["softgel", "liquid", "capsule"],
            "bioavailability": {"notes": "Triglyceride form absorbs better than ethyl ester form. Take with fatty meal for 3x better absorption.", "enhancers": ["fat_source", "phospholipid_form"], "inhibitors": []},
            "half_life": {"hours": "~48-72", "notes": "Tissue levels take 4-8 weeks to reach steady state."},
            "timing_recommendations": {"preferred_windows": ["morning_with_food", "midday"], "avoid_windows": [], "with_food": True, "food_interactions": "Always take with a fat-containing meal. Can cause fishy burps on empty stomach.", "notes": "Freezing softgels reduces fishy aftertaste."},
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "No cycling needed. Daily use is standard for maintaining omega-3 index."},
            "known_interactions": [
                {"substance": "blood_thinners_warfarin", "type": "caution", "severity": "major", "description": "High-dose omega-3 (>3g/day) may increase bleeding risk with anticoagulants."},
            ],
            "synergies": [
                {"substance": "Vitamin D3", "benefit": "Fat-soluble vitamin absorption", "mechanism": "The fat in fish oil enhances D3 absorption when taken together."},
                {"substance": "Curcumin", "benefit": "Synergistic anti-inflammatory effect", "mechanism": "Different anti-inflammatory pathways (prostaglandins vs NF-kB)."},
            ],
            "contraindications": ["fish_allergy", "active_bleeding_disorder"],
            "side_effects": ["fishy_burps", "gi_discomfort", "loose_stools"],
            "safety_notes": "FDA considers up to 3g/day safe. Higher doses should be monitored by a physician due to bleeding risk.",
            "evidence_quality": "strong",
            "sources_summary": "VITAL trial 2019 (NEJM), multiple Cochrane reviews on cardiovascular outcomes.",
        },
    },
    {
        "name": "Ashwagandha KSM-66",
        "category": "hormones_fertility",
        "form": "capsule",
        "goals": ["stress", "sleep"],
        "mechanism_tags": ["adaptogen", "hormone modulation"],
        "description": "Standardized ashwagandha extract for stress reduction, cortisol management, and hormonal balance.",
        "ai_profile": {
            "common_names": ["Ashwagandha", "KSM-66", "Withania somnifera", "Indian Ginseng"],
            "category": "hormones_fertility",
            "mechanism_of_action": "Modulates the HPA axis, reducing cortisol output. Active withanolides mimic GABA, promote BDNF expression, and may inhibit acetylcholinesterase. Adaptogenic: normalizes stress response without sedation at typical doses.",
            "typical_dosages": [
                {"amount": 300, "unit": "mg", "frequency": "twice_daily", "context": "stress_reduction"},
                {"amount": 600, "unit": "mg", "frequency": "daily", "context": "general_adaptogenic"},
            ],
            "forms": ["capsule", "powder", "liquid_extract"],
            "bioavailability": {"notes": "KSM-66 is standardized to 5% withanolides via full-spectrum extraction. Take with food for better absorption.", "enhancers": ["black_pepper", "fat_source"], "inhibitors": []},
            "half_life": {"hours": "~6-12", "notes": "Active withanolides. Full effects accumulate over 4-8 weeks."},
            "timing_recommendations": {"preferred_windows": ["morning_with_food", "evening"], "avoid_windows": [], "with_food": True, "food_interactions": "Take with a meal. Evening dosing may be preferred for sleep-related benefits.", "notes": "Can split dose: morning + evening for sustained effect."},
            "cycling_recommendations": {"suggested": True, "typical_pattern": {"on_weeks": 8, "off_weeks": 2}, "rationale": "Potential receptor desensitization with continuous use. Cycling maintains efficacy."},
            "known_interactions": [
                {"substance": "thyroid_medication", "type": "caution", "severity": "major", "description": "May increase thyroid hormone production. Monitor TSH if on thyroid medication."},
                {"substance": "benzodiazepines", "type": "caution", "severity": "moderate", "description": "Additive sedative effects via GABA modulation."},
                {"substance": "immunosuppressants", "type": "caution", "severity": "moderate", "description": "May stimulate immune system, potentially counteracting immunosuppressive therapy."},
            ],
            "synergies": [
                {"substance": "Magnesium Glycinate", "benefit": "Enhanced stress reduction and sleep", "mechanism": "Complementary calming pathways: GABA (ashwagandha) + NMDA/glycine (magnesium)."},
                {"substance": "Rhodiola Rosea", "benefit": "Broader adaptogenic coverage", "mechanism": "Different primary mechanisms: cortisol (ashwagandha) vs catecholamines (rhodiola)."},
            ],
            "contraindications": ["pregnancy", "autoimmune_thyroid_disease", "pre_surgery_2_weeks"],
            "side_effects": ["drowsiness", "gi_discomfort", "headache"],
            "safety_notes": "Well-tolerated in studies. Start low, titrate up. Avoid in hyperthyroidism.",
            "evidence_quality": "moderate",
            "sources_summary": "Chandrasekhar 2012 (cortisol reduction RCT), Salve 2019 (stress/sleep RCT).",
        },
    },
    {
        "name": "Zinc Picolinate",
        "category": "immune_antimicrobial",
        "form": "capsule",
        "goals": ["skin & appearance", "performance"],
        "mechanism_tags": ["antimicrobial"],
        "description": "Highly bioavailable zinc for immune function, testosterone support, and wound healing.",
        "ai_profile": {
            "common_names": ["Zinc Picolinate", "Zinc", "Chelated Zinc"],
            "category": "immune_antimicrobial",
            "mechanism_of_action": "Cofactor in 300+ enzymes. Essential for immune cell development (T-cells, NK cells), protein synthesis, DNA repair, and hormone production including testosterone and thyroid hormones.",
            "typical_dosages": [
                {"amount": 15, "unit": "mg", "frequency": "daily", "context": "maintenance"},
                {"amount": 30, "unit": "mg", "frequency": "daily", "context": "immune_support"},
                {"amount": 50, "unit": "mg", "frequency": "daily", "context": "deficiency_short_term"},
            ],
            "forms": ["capsule", "tablet", "liquid"],
            "bioavailability": {"notes": "Picolinate form is well-absorbed. Take on an empty stomach for best absorption, but with food if it causes nausea.", "enhancers": ["vitamin_c"], "inhibitors": ["phytic_acid", "calcium_supplements", "iron_supplements"]},
            "half_life": {"hours": "~6-8 in plasma", "notes": "Body has no zinc storage — daily intake needed."},
            "timing_recommendations": {"preferred_windows": ["morning_fasted", "morning_with_food"], "avoid_windows": ["bedtime"], "with_food": False, "food_interactions": "Best absorbed on empty stomach. Take 1hr before or 2hrs after meals. Avoid with dairy, grains, and legumes (phytates bind zinc).", "notes": "If stomach upset, take with a small amount of food."},
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "No cycling needed at maintenance doses. High doses (>40mg) should be short-term to avoid copper depletion."},
            "known_interactions": [
                {"substance": "copper", "type": "caution", "severity": "moderate", "description": "Chronic high-dose zinc depletes copper. Supplement copper (2mg) if taking >30mg zinc daily."},
                {"substance": "antibiotics_tetracycline", "type": "caution", "severity": "moderate", "description": "Zinc chelates antibiotics. Separate by 2+ hours."},
            ],
            "synergies": [
                {"substance": "Vitamin C", "benefit": "Enhanced immune function", "mechanism": "Both critical for immune cell function. Vitamin C may improve zinc absorption."},
                {"substance": "Quercetin", "benefit": "Zinc ionophore effect", "mechanism": "Quercetin acts as a zinc ionophore, increasing intracellular zinc concentration."},
            ],
            "contraindications": ["copper_deficiency"],
            "side_effects": ["nausea_on_empty_stomach", "metallic_taste", "copper_depletion_chronic_high_dose"],
            "safety_notes": "Safe at 15-30mg/day. Above 40mg/day, add 2mg copper to prevent deficiency.",
            "evidence_quality": "strong",
            "sources_summary": "Prasad 2008 (zinc and immunity review), Singh 2013 (zinc lozenges for colds).",
        },
    },
    {
        "name": "Creatine Monohydrate",
        "category": "musculoskeletal",
        "form": "powder",
        "goals": ["performance", "cognitive"],
        "mechanism_tags": ["mitochondrial support"],
        "description": "Most studied sports supplement. Supports ATP regeneration, muscle strength, and cognitive function.",
        "ai_profile": {
            "common_names": ["Creatine Monohydrate", "Creatine", "CreaPure"],
            "category": "musculoskeletal",
            "mechanism_of_action": "Stored as phosphocreatine in muscles and brain. Donates phosphate groups to regenerate ATP during high-intensity efforts. Also acts as an intracellular osmolyte (cell volumization) and neuroprotectant.",
            "typical_dosages": [
                {"amount": 5, "unit": "g", "frequency": "daily", "context": "standard_dose"},
                {"amount": 3, "unit": "g", "frequency": "daily", "context": "lower_body_weight"},
            ],
            "forms": ["powder", "capsule"],
            "bioavailability": {"notes": "Monohydrate is the gold standard — highest evidence, cheapest, and well absorbed (~99%). No need for loading phase; 5g/day reaches saturation in 3-4 weeks.", "enhancers": ["carbohydrates", "protein"], "inhibitors": ["caffeine_very_high_doses"]},
            "half_life": {"hours": "~3 in plasma", "notes": "But muscle stores turn over slowly (~1.7%/day). Consistent daily dosing maintains saturation."},
            "timing_recommendations": {"preferred_windows": ["morning_with_food", "midday"], "avoid_windows": [], "with_food": True, "food_interactions": "Absorbs well with any meal. Taking with carbs + protein may slightly enhance uptake.", "notes": "Timing doesn't matter much — consistency is key. Post-workout may have a slight edge."},
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "No cycling needed. Long-term daily use is safe and well-studied (5+ years in research). Cycling provides no benefit."},
            "known_interactions": [],
            "synergies": [
                {"substance": "Beta-Alanine", "benefit": "Complementary performance enhancement", "mechanism": "Creatine boosts peak power; beta-alanine buffers lactic acid for endurance."},
            ],
            "contraindications": ["severe_kidney_disease"],
            "side_effects": ["water_retention_initial", "gi_discomfort_high_doses"],
            "safety_notes": "One of the safest and most studied supplements. No evidence of kidney damage in healthy individuals. Stay hydrated.",
            "evidence_quality": "strong",
            "sources_summary": "ISSN position stand 2017, Kreider 2017 (safety review), Rawson 2018 (cognitive benefits).",
        },
    },
    {
        "name": "NAC (N-Acetyl Cysteine)",
        "category": "detox_binding",
        "form": "capsule",
        "goals": [],
        "mechanism_tags": ["antioxidant", "detox support"],
        "description": "Precursor to glutathione, the body's master antioxidant. Supports liver detox, respiratory health, and mood.",
        "ai_profile": {
            "common_names": ["NAC", "N-Acetyl Cysteine", "N-Acetylcysteine"],
            "category": "detox_binding",
            "mechanism_of_action": "Rate-limiting precursor for glutathione (GSH) synthesis. Also modulates glutamate via the cystine-glutamate antiporter, mucolytic (thins mucus), chelates heavy metals, and supports liver phase II detoxification.",
            "typical_dosages": [
                {"amount": 600, "unit": "mg", "frequency": "daily", "context": "antioxidant_maintenance"},
                {"amount": 600, "unit": "mg", "frequency": "twice_daily", "context": "respiratory_or_liver_support"},
            ],
            "forms": ["capsule", "tablet", "powder"],
            "bioavailability": {"notes": "Oral bioavailability is ~6-10%, but this is sufficient to raise glutathione levels. Take on empty stomach for best absorption.", "enhancers": ["vitamin_c"], "inhibitors": ["activated_charcoal"]},
            "half_life": {"hours": "~5.6", "notes": "Short half-life supports twice-daily dosing for sustained glutathione elevation."},
            "timing_recommendations": {"preferred_windows": ["morning_fasted"], "avoid_windows": [], "with_food": False, "food_interactions": "Best absorbed on empty stomach (30 min before meals). Food reduces peak absorption but not total uptake significantly.", "notes": "Morning fasted is optimal. Can take with vitamin C."},
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "Generally safe for continuous use. Some practitioners suggest periodic breaks, but evidence doesn't mandate it."},
            "known_interactions": [
                {"substance": "nitroglycerin", "type": "contraindication", "severity": "major", "description": "NAC potentiates vasodilatory effects of nitroglycerin — risk of severe hypotension."},
                {"substance": "activated_charcoal", "type": "caution", "severity": "minor", "description": "Charcoal adsorbs NAC, reducing its effectiveness. Separate by 2+ hours."},
            ],
            "synergies": [
                {"substance": "Vitamin C", "benefit": "Enhanced antioxidant recycling", "mechanism": "C regenerates glutathione; NAC provides the cysteine for new GSH synthesis."},
                {"substance": "Selenium", "benefit": "Glutathione peroxidase activation", "mechanism": "Selenium is a cofactor for glutathione peroxidase. NAC provides substrate; selenium activates the enzyme."},
            ],
            "contraindications": ["concurrent_nitroglycerin_use", "active_stomach_ulcer"],
            "side_effects": ["gi_discomfort", "sulfurous_smell", "headache"],
            "safety_notes": "Well-studied pharmaceutical compound. FDA-approved as Mucomyst. Safe at standard doses.",
            "evidence_quality": "strong",
            "sources_summary": "Mokhtari 2017 (NAC clinical review), Dean 2011 (NAC in psychiatry).",
        },
    },
    {
        "name": "Vitamin K2 MK-7",
        "category": "cardiovascular",
        "form": "softgel",
        "goals": ["bone health"],
        "mechanism_tags": [],
        "description": "Fat-soluble vitamin that directs calcium to bones and away from arteries. Essential D3 companion.",
        "ai_profile": {
            "common_names": ["Vitamin K2", "MK-7", "Menaquinone-7"],
            "category": "cardiovascular",
            "mechanism_of_action": "Activates osteocalcin (directs calcium into bones) and matrix GLA protein (prevents calcium deposition in arteries). MK-7 has the longest half-life of K2 forms.",
            "typical_dosages": [
                {"amount": 100, "unit": "mcg", "frequency": "daily", "context": "standard_with_d3"},
                {"amount": 200, "unit": "mcg", "frequency": "daily", "context": "higher_d3_doses"},
            ],
            "forms": ["softgel", "capsule", "drops"],
            "bioavailability": {"notes": "MK-7 has the best bioavailability and longest half-life (~72h) of all K2 forms. Fat-soluble — take with fat.", "enhancers": ["fat_source", "vitamin_d3"], "inhibitors": ["mineral_oil"]},
            "half_life": {"hours": "~72", "notes": "MK-7 accumulates to stable levels with daily dosing."},
            "timing_recommendations": {"preferred_windows": ["morning_with_food"], "avoid_windows": [], "with_food": True, "food_interactions": "Take with a fat-containing meal, ideally alongside vitamin D3.", "notes": "Pair with D3 for optimal calcium metabolism."},
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "No cycling needed. Daily supplementation is safe and recommended whenever taking D3."},
            "known_interactions": [
                {"substance": "warfarin", "type": "contraindication", "severity": "critical", "description": "K2 directly counteracts warfarin's mechanism. DO NOT take K2 with warfarin without physician approval."},
            ],
            "synergies": [
                {"substance": "Vitamin D3", "benefit": "Prevents arterial calcification from D3+calcium", "mechanism": "D3 increases calcium absorption; K2 ensures it goes to bones, not arteries."},
                {"substance": "Calcium", "benefit": "Safer calcium supplementation", "mechanism": "K2 mitigates the cardiovascular risk of calcium supplementation by preventing arterial deposition."},
            ],
            "contraindications": ["warfarin_use_without_md_approval"],
            "side_effects": [],
            "safety_notes": "No known toxicity even at high doses. Essential companion to vitamin D3 supplementation.",
            "evidence_quality": "moderate",
            "sources_summary": "Knapen 2015 (MK-7 and arterial stiffness RCT), Geleijnse 2004 (Rotterdam Study).",
        },
    },
    {
        "name": "Curcumin (Turmeric Extract)",
        "category": "inflammation_antioxidant",
        "form": "capsule",
        "goals": ["joints"],
        "mechanism_tags": ["anti-inflammatory", "antioxidant"],
        "description": "Potent anti-inflammatory compound from turmeric. Targets NF-kB and COX-2 pathways.",
        "ai_profile": {
            "common_names": ["Curcumin", "Turmeric Extract", "Curcuma longa"],
            "category": "inflammation_antioxidant",
            "mechanism_of_action": "Inhibits NF-kB (master inflammatory transcription factor), COX-2, and LOX enzymes. Also activates Nrf2 (antioxidant response), modulates BDNF, and has anti-amyloid properties.",
            "typical_dosages": [
                {"amount": 500, "unit": "mg", "frequency": "daily", "context": "general_anti_inflammatory"},
                {"amount": 1000, "unit": "mg", "frequency": "daily", "context": "joint_pain_or_recovery"},
            ],
            "forms": ["capsule", "powder", "liquid"],
            "bioavailability": {"notes": "Native curcumin has extremely poor absorption (<1%). MUST use enhanced form: piperine (20x), liposomal (30x), or phytosome/Meriva (29x).", "enhancers": ["piperine_black_pepper", "fat_source", "liposomal_delivery"], "inhibitors": []},
            "half_life": {"hours": "~6-8 for enhanced forms", "notes": "Short half-life; split dosing recommended for sustained levels."},
            "timing_recommendations": {"preferred_windows": ["morning_with_food", "evening"], "avoid_windows": [], "with_food": True, "food_interactions": "Take with fat and black pepper. Piperine (BioPerine) is often included in formulations.", "notes": "Split dose AM/PM for better coverage."},
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "Safe for continuous daily use. No tolerance or desensitization observed."},
            "known_interactions": [
                {"substance": "blood_thinners", "type": "caution", "severity": "moderate", "description": "Curcumin has mild antiplatelet activity. Use caution with anticoagulants."},
                {"substance": "iron_supplements", "type": "caution", "severity": "minor", "description": "Curcumin chelates iron. Separate dosing by 2+ hours if iron-deficient."},
            ],
            "synergies": [
                {"substance": "Omega-3 Fish Oil", "benefit": "Synergistic anti-inflammatory effect", "mechanism": "Target different inflammatory pathways: NF-kB (curcumin) + prostaglandins (EPA)."},
                {"substance": "Boswellia", "benefit": "Joint support stack", "mechanism": "Curcumin inhibits NF-kB; Boswellia inhibits 5-LOX. Complementary anti-inflammatory action."},
            ],
            "contraindications": ["gallbladder_obstruction", "pre_surgery_2_weeks"],
            "side_effects": ["gi_discomfort", "yellow_staining", "headache_rare"],
            "safety_notes": "Very safe at recommended doses. Ensure you use a bioavailability-enhanced form.",
            "evidence_quality": "moderate",
            "sources_summary": "Daily 2016 (curcumin systematic review), Hewlings 2017 (curcumin review).",
        },
    },
    {
        "name": "Probiotics (Multi-Strain)",
        "category": "gut_digestion",
        "form": "capsule",
        "goals": ["immunity"],
        "mechanism_tags": ["gut microbiome modulation"],
        "description": "Live beneficial bacteria for gut microbiome support, immune modulation, and digestive health.",
        "ai_profile": {
            "common_names": ["Probiotics", "Multi-Strain Probiotics", "Lactobacillus/Bifidobacterium"],
            "category": "gut_digestion",
            "mechanism_of_action": "Colonize the gut, competing with pathogenic bacteria. Produce short-chain fatty acids (butyrate), modulate immune response via gut-associated lymphoid tissue (GALT), and support intestinal barrier integrity.",
            "typical_dosages": [
                {"amount": 10, "unit": "billion_CFU", "frequency": "daily", "context": "maintenance"},
                {"amount": 50, "unit": "billion_CFU", "frequency": "daily", "context": "after_antibiotics_or_gi_issues"},
            ],
            "forms": ["capsule", "powder", "liquid"],
            "bioavailability": {"notes": "Survival through stomach acid varies by strain. Enteric-coated or spore-based forms have better survival. Take on empty stomach or with a non-acidic meal.", "enhancers": ["prebiotic_fiber"], "inhibitors": ["antibiotics", "very_hot_liquids"]},
            "half_life": {"hours": "Variable", "notes": "Most probiotic strains do not permanently colonize. Continuous supplementation needed for sustained effects."},
            "timing_recommendations": {"preferred_windows": ["morning_fasted", "bedtime"], "avoid_windows": [], "with_food": False, "food_interactions": "Best on empty stomach (30 min before eating) to minimize acid exposure. Some evidence supports bedtime dosing when stomach acid is lowest.", "notes": "Consistency matters more than timing."},
            "cycling_recommendations": {"suggested": False, "typical_pattern": None, "rationale": "Daily use is standard. Some rotate strains every few months for diversity."},
            "known_interactions": [
                {"substance": "antibiotics", "type": "caution", "severity": "moderate", "description": "Antibiotics kill probiotic bacteria. Separate by 2+ hours. Continue probiotics for 2 weeks after antibiotic course."},
            ],
            "synergies": [
                {"substance": "Prebiotic Fiber", "benefit": "Feeds and supports probiotic colonization", "mechanism": "Prebiotics (inulin, FOS, GOS) are food for probiotic bacteria, enhancing their proliferation."},
            ],
            "contraindications": ["severe_immunocompromise", "short_bowel_syndrome"],
            "side_effects": ["bloating_initial", "gas_initial"],
            "safety_notes": "Very safe for healthy individuals. Start with lower CFU and increase gradually if bloating occurs.",
            "evidence_quality": "moderate",
            "sources_summary": "Ritchie 2012 (meta-analysis on IBS), Hao 2015 (probiotics for respiratory infections).",
        },
    },
]

THERAPIES = [
    {
        "name": "HBOT",
        "category": "other",
        "description": "Hyperbaric oxygen therapy session used for recovery, resilience, and focused oxygen exposure.",
        "ai_profile": {
            "tags": ["hbot", "hyperbaric", "recovery", "pressure_therapy"],
            "default_duration_minutes": 60,
            "default_frequency": "weekly",
            "default_take_window": "afternoon",
            "session_template": "60 min at 2.0 ATA",
        },
    },
    {
        "name": "Infrared Sauna",
        "category": "thermal",
        "description": "Heat exposure protocol for recovery, sweating, relaxation, and cardiovascular conditioning.",
        "ai_profile": {
            "tags": ["sauna", "thermal", "recovery"],
            "default_duration_minutes": 25,
            "default_frequency": "daily",
            "default_take_window": "evening",
            "session_template": "20-30 min moderate heat block",
        },
    },
    {
        "name": "IHHT",
        "category": "breathwork",
        "description": "Intermittent hypoxia-hyperoxia training protocol for conditioning, respiratory adaptation, and recovery.",
        "ai_profile": {
            "tags": ["ihht", "hypoxia", "hyperoxia", "respiratory_training"],
            "default_duration_minutes": 35,
            "default_frequency": "weekly",
            "default_take_window": "morning_with_food",
            "session_template": "Alternating hypoxia and hyperoxia rounds",
        },
    },
    {
        "name": "Lymphatic Massage",
        "category": "manual",
        "description": "Manual recovery session focused on drainage, swelling reduction, and tissue support.",
        "ai_profile": {
            "tags": ["lymphatic", "massage", "manual_therapy", "recovery"],
            "default_duration_minutes": 45,
            "default_frequency": "weekly",
            "default_take_window": "afternoon",
            "session_template": "Full body drainage sequence",
        },
    },
    {
        "name": "PEMF",
        "category": "electrical",
        "description": "Pulsed electromagnetic field session for recovery, relaxation, and device-led protocol blocks.",
        "ai_profile": {
            "tags": ["pemf", "electromagnetic", "device_protocol"],
            "default_duration_minutes": 20,
            "default_frequency": "daily",
            "default_take_window": "afternoon",
            "session_template": "20 min device program",
        },
    },
    {
        "name": "Nurosym VNS",
        "category": "electrical",
        "description": "Auricular vagus nerve stimulation session using a dedicated neurostimulation device.",
        "ai_profile": {
            "tags": ["nurosym", "vns", "neurostimulation", "device_protocol"],
            "default_duration_minutes": 20,
            "default_frequency": "daily",
            "default_take_window": "morning_with_food",
            "session_template": "20 min vagal stimulation block",
        },
    },
    {
        "name": "Muse 2 Meditation",
        "category": "sound",
        "description": "Guided meditation session using Muse 2 neurofeedback for attention and nervous-system regulation.",
        "ai_profile": {
            "tags": ["muse_2", "meditation", "mindfulness", "neurofeedback"],
            "default_duration_minutes": 15,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "15 min mindfulness or breath-led neurofeedback",
        },
    },
    {
        "name": "Transcendental Meditation",
        "category": "sound",
        "description": "Seated meditation practice block for focus, calm, and nervous-system downshifting.",
        "ai_profile": {
            "tags": ["meditation", "transcendental", "mind_body"],
            "default_duration_minutes": 20,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "20 min seated meditation",
        },
    },
    {
        "name": "EMOM Pull-Up Session",
        "category": "movement",
        "description": "Minute-by-minute strength protocol for pull-ups, calisthenics, or targeted skill progression.",
        "ai_profile": {
            "tags": ["training", "emom", "pullups", "calisthenics"],
            "default_duration_minutes": 18,
            "default_frequency": "weekly",
            "default_take_window": "afternoon",
            "session_template": "EMOM pull-up ladder with planned volume",
        },
    },
    {
        "name": "Hyrox Interval Session",
        "category": "movement",
        "description": "Structured endurance and station-based training block for Hyrox preparation.",
        "ai_profile": {
            "tags": ["training", "hyrox", "intervals", "conditioning"],
            "default_duration_minutes": 45,
            "default_frequency": "weekly",
            "default_take_window": "afternoon",
            "session_template": "Intervals plus sled, carries, and run transitions",
        },
    },
    {
        "name": "Infrared Panel",
        "category": "light",
        "description": "Red or infrared light exposure routine for full body, front-only, face, or segmented side blocks.",
        "ai_profile": {
            "tags": ["infrared", "red_light", "light_therapy"],
            "default_duration_minutes": 16,
            "default_frequency": "daily",
            "default_take_window": "morning_with_food",
            "session_template": "4 min per side or 5 min front-only block",
        },
    },
    {
        "name": "Lyma Laser",
        "category": "light",
        "description": "Targeted laser routine for skin and tissue support using a handheld device.",
        "ai_profile": {
            "tags": ["lyma", "laser", "skin", "light_therapy"],
            "default_duration_minutes": 12,
            "default_frequency": "daily",
            "default_take_window": "evening",
            "session_template": "Targeted face or treatment-zone passes",
        },
    },
    {
        "name": "Microneedling",
        "category": "skincare",
        "description": "Periodic skin protocol for texture, collagen support, and resurfacing routines.",
        "ai_profile": {
            "tags": ["skin", "microneedling", "collagen"],
            "default_duration_minutes": 20,
            "default_frequency": "weekly",
            "default_take_window": "evening",
            "session_template": "Face-focused pass sequence with recovery notes",
        },
    },
    {
        "name": "CO2 Resurfacing",
        "category": "skincare",
        "description": "Infrequent resurfacing treatment placeholder for planning annual or seasonal skin protocols.",
        "ai_profile": {
            "tags": ["skin", "co2", "resurfacing", "aesthetic"],
            "default_duration_minutes": 30,
            "default_frequency": "weekly",
            "default_take_window": "evening",
            "session_template": "Procedure planning and aftercare tracking block",
        },
    },
    # --- Skincare ---
    {
        "name": "Chemical Peel",
        "category": "skincare",
        "description": "Periodic acid-based exfoliation for skin texture, tone, and collagen stimulation.",
        "ai_profile": {
            "tags": ["skin", "chemical_peel", "exfoliation", "aesthetic"],
            "default_duration_minutes": 15,
            "default_frequency": "weekly",
            "default_take_window": "evening",
            "session_template": "Apply peel, timed contact, neutralize, moisturize",
        },
    },
    {
        "name": "LED Face Mask",
        "category": "skincare",
        "description": "At-home LED light therapy mask session targeting acne, inflammation, or collagen production.",
        "ai_profile": {
            "tags": ["skin", "led", "light_therapy", "face_mask"],
            "default_duration_minutes": 10,
            "default_frequency": "daily",
            "default_take_window": "evening",
            "session_template": "10 min red/NIR or blue light mask session",
        },
    },
    {
        "name": "Gua Sha Facial",
        "category": "skincare",
        "description": "Facial massage using a gua sha stone for lymphatic drainage, sculpting, and circulation.",
        "ai_profile": {
            "tags": ["skin", "gua_sha", "facial_massage", "lymphatic"],
            "default_duration_minutes": 10,
            "default_frequency": "daily",
            "default_take_window": "morning_with_food",
            "session_template": "Upward and outward strokes with serum or oil",
        },
    },
    {
        "name": "Retinoid Application",
        "category": "skincare",
        "description": "Evening topical retinoid routine for skin renewal, anti-aging, and texture improvement.",
        "ai_profile": {
            "tags": ["skin", "retinoid", "tretinoin", "anti_aging"],
            "default_duration_minutes": 5,
            "default_frequency": "every_other_day",
            "default_take_window": "bedtime",
            "session_template": "Cleanse, wait, apply pea-sized amount, moisturize",
        },
    },
    # --- Haircare ---
    {
        "name": "Scalp Massage",
        "category": "haircare",
        "description": "Manual or device-assisted scalp massage for blood flow stimulation and hair follicle health.",
        "ai_profile": {
            "tags": ["hair", "scalp_massage", "circulation", "follicle_health"],
            "default_duration_minutes": 5,
            "default_frequency": "daily",
            "default_take_window": "evening",
            "session_template": "5 min fingertip or scalp massager circular motions",
        },
    },
    {
        "name": "LED Hair Cap",
        "category": "haircare",
        "description": "Low-level laser therapy cap session for hair growth stimulation and follicle support.",
        "ai_profile": {
            "tags": ["hair", "lllt", "led_cap", "hair_growth"],
            "default_duration_minutes": 20,
            "default_frequency": "every_other_day",
            "default_take_window": "evening",
            "session_template": "20 min device-timed LLLT session",
        },
    },
    {
        "name": "PRP Scalp Treatment",
        "category": "haircare",
        "description": "Platelet-rich plasma injection session for hair restoration. Track scheduling and aftercare.",
        "ai_profile": {
            "tags": ["hair", "prp", "injection", "hair_restoration"],
            "default_duration_minutes": 45,
            "default_frequency": "weekly",
            "default_take_window": "morning_with_food",
            "session_template": "Blood draw, centrifuge, scalp injection grid, aftercare",
        },
    },
    {
        "name": "Dermaroller Scalp",
        "category": "haircare",
        "description": "Microneedling the scalp with a dermaroller to enhance topical absorption and stimulate follicles.",
        "ai_profile": {
            "tags": ["hair", "dermaroller", "microneedling", "scalp"],
            "default_duration_minutes": 10,
            "default_frequency": "weekly",
            "default_take_window": "evening",
            "session_template": "Roll scalp in sections, apply minoxidil 24h later",
        },
    },
    # --- Recovery ---
    {
        "name": "Cold Plunge",
        "category": "recovery",
        "description": "Deliberate cold water immersion for recovery, dopamine, norepinephrine, and resilience training.",
        "ai_profile": {
            "tags": ["cold", "plunge", "ice_bath", "cold_exposure", "recovery"],
            "default_duration_minutes": 5,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "2-5 min full immersion at 3-7°C",
        },
    },
    {
        "name": "Compression Boots",
        "category": "recovery",
        "description": "Pneumatic compression device session for lymphatic drainage, circulation, and muscle recovery.",
        "ai_profile": {
            "tags": ["compression", "normatec", "recovery", "lymphatic"],
            "default_duration_minutes": 30,
            "default_frequency": "daily",
            "default_take_window": "evening",
            "session_template": "30 min sequential compression at moderate intensity",
        },
    },
    {
        "name": "Contrast Therapy",
        "category": "recovery",
        "description": "Alternating hot and cold exposure for vascular pumping, recovery, and inflammation management.",
        "ai_profile": {
            "tags": ["contrast", "hot_cold", "sauna_plunge", "recovery"],
            "default_duration_minutes": 30,
            "default_frequency": "weekly",
            "default_take_window": "afternoon",
            "session_template": "3 rounds: 10 min sauna → 2 min cold plunge",
        },
    },
    {
        "name": "Foam Rolling",
        "category": "recovery",
        "description": "Self-myofascial release session for mobility, soreness reduction, and tissue quality.",
        "ai_profile": {
            "tags": ["foam_rolling", "myofascial", "recovery", "mobility"],
            "default_duration_minutes": 15,
            "default_frequency": "daily",
            "default_take_window": "evening",
            "session_template": "Major muscle groups, 60s per area, slow rolls",
        },
    },
    # --- Cognitive ---
    {
        "name": "Focus Session",
        "category": "cognitive",
        "description": "Timed deep-work block with optional binaural beats or focus music for sustained attention training.",
        "ai_profile": {
            "tags": ["focus", "deep_work", "attention", "cognitive"],
            "default_duration_minutes": 90,
            "default_frequency": "daily",
            "default_take_window": "morning_with_food",
            "session_template": "90 min ultradian focus block, no interruptions",
        },
    },
    {
        "name": "Dual N-Back Training",
        "category": "cognitive",
        "description": "Working memory training exercise shown to improve fluid intelligence and executive function.",
        "ai_profile": {
            "tags": ["cognitive", "n_back", "working_memory", "brain_training"],
            "default_duration_minutes": 20,
            "default_frequency": "daily",
            "default_take_window": "morning_with_food",
            "session_template": "20 min progressive difficulty dual n-back rounds",
        },
    },
    {
        "name": "Journaling",
        "category": "cognitive",
        "description": "Structured writing practice for reflection, gratitude, or cognitive reframing.",
        "ai_profile": {
            "tags": ["journaling", "reflection", "gratitude", "cognitive"],
            "default_duration_minutes": 10,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "Morning pages or structured gratitude/reflection prompts",
        },
    },
    # --- Movement (additional) ---
    {
        "name": "Zone 2 Cardio",
        "category": "movement",
        "description": "Low-intensity aerobic session at conversational pace for mitochondrial health and fat oxidation.",
        "ai_profile": {
            "tags": ["cardio", "zone_2", "aerobic", "endurance"],
            "default_duration_minutes": 45,
            "default_frequency": "daily",
            "default_take_window": "morning_with_food",
            "session_template": "45 min walk, jog, or cycle at 60-70% max HR",
        },
    },
    {
        "name": "Strength Training",
        "category": "movement",
        "description": "Resistance training session for hypertrophy, strength, or power development.",
        "ai_profile": {
            "tags": ["training", "strength", "resistance", "hypertrophy"],
            "default_duration_minutes": 60,
            "default_frequency": "daily",
            "default_take_window": "afternoon",
            "session_template": "Compound lifts + accessories, RPE-based progression",
        },
    },
    {
        "name": "Mobility & Stretching",
        "category": "movement",
        "description": "Dedicated flexibility and joint mobility session for injury prevention and movement quality.",
        "ai_profile": {
            "tags": ["mobility", "stretching", "flexibility", "movement_prep"],
            "default_duration_minutes": 15,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "Dynamic warm-up or static stretch flow, 30-60s per position",
        },
    },
    {
        "name": "Yoga",
        "category": "movement",
        "description": "Yoga practice session for flexibility, strength, balance, and mind-body integration.",
        "ai_profile": {
            "tags": ["yoga", "flexibility", "mind_body", "movement"],
            "default_duration_minutes": 30,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "Vinyasa or Hatha flow, sun salutations to savasana",
        },
    },
    # --- Breathwork (additional) ---
    {
        "name": "Wim Hof Breathing",
        "category": "breathwork",
        "description": "Cyclic hyperventilation and retention protocol for stress resilience and alkalinity training.",
        "ai_profile": {
            "tags": ["breathwork", "wim_hof", "hyperventilation", "cold_prep"],
            "default_duration_minutes": 15,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "3 rounds: 30 power breaths → max retention → recovery breath",
        },
    },
    {
        "name": "Box Breathing",
        "category": "breathwork",
        "description": "Equal-ratio breathing protocol for parasympathetic activation, calm, and focus.",
        "ai_profile": {
            "tags": ["breathwork", "box_breathing", "nervous_system", "calm"],
            "default_duration_minutes": 5,
            "default_frequency": "daily",
            "default_take_window": "morning_fasted",
            "session_template": "4-4-4-4 cadence for 5 minutes",
        },
    },
]

MEDICATIONS = [
    {
        "name": "Finasteride",
        "category": "dermatological",
        "form": "tablet",
        "description": "Oral 5-alpha-reductase inhibitor commonly used for hair-loss protocols.",
        "ai_profile": {
            "common_names": ["Finasteride", "Propecia", "Proscar"],
            "typical_dosages": [
                {"amount": 1, "unit": "mg", "frequency": "daily", "context": "hair_loss"},
            ],
            "timing_recommendations": {
                "preferred_windows": ["morning_with_food"],
                "with_food": False,
                "notes": "Consistency matters more than precise timing.",
            },
            "known_interactions": [
                {
                    "substance": "saw_palmetto",
                    "type": "caution",
                    "severity": "moderate",
                    "description": "May add to DHT-lowering effects. Track libido, mood, and adverse effects together.",
                }
            ],
            "monitoring_notes": "Track side effects, hair shedding phases, and long-horizon response.",
            "safety_notes": "Avoid handling crushed tablets during pregnancy. Review sexual and mood side effects with a clinician.",
        },
    },
    {
        "name": "Topical Minoxidil 5%",
        "category": "dermatological",
        "form": "foam",
        "description": "Topical vasodilator commonly used for scalp hair-loss protocols.",
        "ai_profile": {
            "common_names": ["Minoxidil", "Topical Minoxidil", "Rogaine"],
            "typical_dosages": [
                {"amount": 1, "unit": "application", "frequency": "twice_daily", "context": "hair_loss"},
            ],
            "timing_recommendations": {
                "preferred_windows": ["morning_with_food", "evening"],
                "with_food": False,
                "notes": "Allow the scalp to dry fully before layering other products.",
            },
            "known_interactions": [],
            "monitoring_notes": "Track shedding phase, scalp tolerance, and consistency of application.",
            "safety_notes": "Avoid eye contact and discontinue if scalp irritation persists.",
        },
    },
    {
        "name": "Oral Minoxidil",
        "category": "dermatological",
        "form": "tablet",
        "description": "Low-dose oral minoxidil protocol sometimes used for hair-loss treatment.",
        "ai_profile": {
            "common_names": ["Oral Minoxidil", "Minoxidil"],
            "typical_dosages": [
                {"amount": 2.5, "unit": "mg", "frequency": "daily", "context": "hair_loss"},
            ],
            "timing_recommendations": {
                "preferred_windows": ["evening"],
                "with_food": False,
                "notes": "Keep timing consistent and monitor blood-pressure symptoms.",
            },
            "known_interactions": [],
            "monitoring_notes": "Watch edema, dizziness, resting heart rate, and blood pressure.",
            "safety_notes": "Requires clinician oversight due to cardiovascular effects.",
        },
    },
    {
        "name": "Ketoconazole Shampoo 2%",
        "category": "dermatological",
        "form": "shampoo",
        "description": "Medicated shampoo often used as part of scalp or hair-loss routines.",
        "ai_profile": {
            "common_names": ["Ketoconazole Shampoo", "Nizoral"],
            "typical_dosages": [
                {"amount": 1, "unit": "wash", "frequency": "weekly", "context": "scalp_protocol"},
            ],
            "timing_recommendations": {
                "preferred_windows": ["evening"],
                "with_food": False,
                "notes": "Leave on the scalp briefly before rinsing as directed.",
            },
            "known_interactions": [],
            "monitoring_notes": "Track scalp dryness, dandruff, and wash frequency.",
            "safety_notes": "Avoid overuse if the scalp becomes irritated or overly dry.",
        },
    },
]

MEDICATION_CATALOG = [
    # ── Longevity ──────────────────────────────────────────────────────
    {"name": "Rapamycin (Sirolimus)", "category": "longevity", "form": "tablet", "description": "mTOR inhibitor. Low-dose intermittent protocols (e.g., 5-6 mg weekly) investigated for geroprotection."},
    {"name": "Metformin", "category": "metabolic", "form": "tablet", "description": "Biguanide that activates AMPK and reduces hepatic glucose production. TAME trial investigating longevity."},
    {"name": "Acarbose", "category": "metabolic", "form": "tablet", "description": "Alpha-glucosidase inhibitor that slows carb digestion. Extended lifespan in male mice (ITP study)."},
    {"name": "Dasatinib", "category": "longevity", "form": "tablet", "description": "Tyrosine kinase inhibitor used as a senolytic. Combined with quercetin in D+Q senolytic protocols."},
    {"name": "Rilmenidine", "category": "longevity", "form": "tablet", "description": "Centrally-acting antihypertensive that induces autophagy. Emerging longevity research compound."},
    {"name": "Canagliflozin", "category": "metabolic", "form": "tablet", "description": "SGLT2 inhibitor. Extended lifespan in male mice (ITP study). Promotes glycosuria and metabolic benefits."},
    {"name": "Pioglitazone", "category": "metabolic", "form": "tablet", "description": "Thiazolidinedione (PPAR-gamma agonist) that improves insulin sensitivity. Investigated for neuroprotection."},
    {"name": "Deprenyl (Selegiline)", "category": "longevity", "form": "tablet", "description": "MAO-B inhibitor. Low doses investigated for neuroprotection and lifespan extension."},
    {"name": "Meclizine", "category": "longevity", "form": "tablet", "description": "Antihistamine that may activate hypoxia response pathways (HIF-1a). ITP study showed lifespan effects."},
    # ── Hormonal ───────────────────────────────────────────────────────
    {"name": "Bioidentical Testosterone", "category": "hormonal", "form": "cream", "description": "Testosterone replacement (cream/pellets) for age-related hypogonadism. Requires monitoring."},
    {"name": "Estradiol (17-alpha)", "category": "hormonal", "form": "tablet", "description": "Non-feminizing estrogen form investigated for male longevity. ITP study showed lifespan extension."},
    {"name": "Enclomiphene", "category": "hormonal", "form": "capsule", "description": "Selective estrogen receptor modulator that stimulates endogenous testosterone via LH/FSH."},
    {"name": "DHEA", "category": "hormonal", "form": "capsule", "description": "Precursor hormone. Prescription in some countries, OTC in others. Supports testosterone and estrogen."},
    {"name": "HGH (Somatotropin)", "category": "hormonal", "form": "injectable", "description": "Recombinant human growth hormone. Used for GH deficiency. Controversial for anti-aging."},
    {"name": "Oxytocin (Nasal)", "category": "hormonal", "form": "nasal spray", "description": "Neuropeptide hormone administered intranasally for social bonding and stress research."},
    # ── Cardiovascular ─────────────────────────────────────────────────
    {"name": "Aspirin (Low-Dose)", "category": "cardiovascular", "form": "tablet", "description": "Antiplatelet agent. 81 mg daily for cardiovascular risk reduction in select populations."},
    {"name": "Rosuvastatin", "category": "cardiovascular", "form": "tablet", "description": "HMG-CoA reductase inhibitor (statin). Most potent statin for LDL reduction."},
    {"name": "Telmisartan", "category": "cardiovascular", "form": "tablet", "description": "ARB with PPAR-gamma activation. May have metabolic and longevity benefits beyond blood pressure."},
    {"name": "Captopril", "category": "cardiovascular", "form": "tablet", "description": "ACE inhibitor. ITP study showed lifespan extension in male mice."},
    {"name": "Ivabradine", "category": "cardiovascular", "form": "tablet", "description": "Selective If channel blocker that reduces heart rate without affecting blood pressure."},
    {"name": "Verapamil", "category": "cardiovascular", "form": "tablet", "description": "Calcium channel blocker. Investigated for type 1 diabetes beta-cell preservation."},
    {"name": "Hydralazine", "category": "cardiovascular", "form": "tablet", "description": "Vasodilator. Emerging longevity interest due to epigenetic effects at low doses."},
    {"name": "Pentoxifylline", "category": "cardiovascular", "form": "tablet", "description": "Phosphodiesterase inhibitor that improves blood flow. Anti-inflammatory and anti-fibrotic properties."},
    # ── Cognitive ──────────────────────────────────────────────────────
    {"name": "Modafinil", "category": "cognitive", "form": "tablet", "description": "Eugeroic (wakefulness promoter). Off-label for cognitive enhancement."},
    {"name": "Piracetam", "category": "cognitive", "form": "tablet", "description": "Original racetam nootropic. Modulates AMPA receptors and improves membrane fluidity."},
    {"name": "Aniracetam", "category": "cognitive", "form": "capsule", "description": "Fat-soluble racetam with anxiolytic properties. Modulates AMPA and metabotropic glutamate receptors."},
    {"name": "Nicotine (Patch/Gum)", "category": "cognitive", "form": "patch", "description": "Nicotinic acetylcholine receptor agonist. Low-dose transdermal investigated for cognitive enhancement."},
    # ── Metabolic / GLP-1 ──────────────────────────────────────────────
    {"name": "Tadalafil", "category": "cardiovascular", "form": "tablet", "description": "PDE5 inhibitor. Low-dose daily (2.5-5 mg) supports vascular health beyond erectile function."},
    # ── Anti-inflammatory ──────────────────────────────────────────────
    {"name": "Low-Dose Naltrexone", "category": "anti_inflammatory", "form": "capsule", "description": "Opioid antagonist at 1-4.5 mg. Modulates immune function via TLR4 and endorphin upregulation."},
    {"name": "Colchicine (Low-Dose)", "category": "anti_inflammatory", "form": "tablet", "description": "Anti-inflammatory that inhibits tubulin polymerization. Low-dose reduces cardiovascular events."},
    # ── Other ──────────────────────────────────────────────────────────
    {"name": "Lithium (Rx)", "category": "cognitive", "form": "tablet", "description": "Mood stabilizer at Rx doses. Inhibits GSK-3beta, supports neuroprotection."},
    {"name": "Methylene Blue", "category": "longevity", "form": "liquid", "description": "Mitochondrial electron carrier. Low doses (0.5-2 mg/kg) investigated for cognitive and mitochondrial support."},
    {"name": "Emoxypine (Mexidol)", "category": "cognitive", "form": "tablet", "description": "Antioxidant and anxiolytic. Protects membranes from lipid peroxidation. Approved in Russia."},
    {"name": "NAD+ (IV/IM)", "category": "longevity", "form": "injectable", "description": "Direct NAD+ administration via IV or intramuscular injection for rapid NAD+ repletion."},
    {"name": "Glutathione (IV)", "category": "other", "form": "injectable", "description": "IV glutathione for direct antioxidant repletion. Bypasses oral bioavailability limitations."},
]

PEPTIDES = [
    {
        "name": "BPC-157",
        "category": "recovery",
        "form": "injectable",
        "goals": ["joint health"],
        "mechanism_tags": ["anti-inflammatory"],
        "description": "Body Protection Compound. Promotes tendon, ligament, and gut healing via angiogenesis and growth factor modulation.",
    },
    {
        "name": "TB-500 (Thymosin Beta-4)",
        "category": "recovery",
        "form": "injectable",
        "goals": ["joint health"],
        "mechanism_tags": ["anti-inflammatory"],
        "description": "Promotes tissue repair, cell migration, and blood vessel formation. Supports wound and injury recovery.",
    },
    {
        "name": "GHK-Cu",
        "category": "cosmetic",
        "form": "topical",
        "goals": ["skin", "hair"],
        "mechanism_tags": ["anti-inflammatory"],
        "description": "Copper tripeptide that stimulates collagen, elastin, and glycosaminoglycan synthesis. Supports skin and hair.",
    },
    {
        "name": "Epitalon (Epithalon)",
        "category": "research",
        "form": "injectable",
        "goals": ["longevity"],
        "mechanism_tags": ["epigenetic modulator"],
        "description": "Tetrapeptide that activates telomerase, potentially extending telomere length. Anti-aging research peptide.",
    },
    {
        "name": "DSIP (Delta Sleep-Inducing Peptide)",
        "category": "therapeutic",
        "form": "injectable",
        "goals": ["sleep"],
        "mechanism_tags": ["neuroprotective"],
        "description": "Neuropeptide that modulates sleep architecture and promotes deeper delta-wave sleep.",
    },
    {
        "name": "CJC-1295 / Ipamorelin",
        "category": "performance",
        "form": "injectable",
        "goals": ["energy", "longevity"],
        "mechanism_tags": [],
        "description": "Growth hormone secretagogue combo. CJC-1295 (GHRH analog) + Ipamorelin (ghrelin mimetic) for pulsatile GH release.",
    },
    {
        "name": "Tesamorelin",
        "category": "performance",
        "form": "injectable",
        "goals": ["weight management"],
        "mechanism_tags": [],
        "description": "GHRH analog that stimulates natural GH production. FDA-approved for HIV-associated lipodystrophy.",
    },
    {
        "name": "Sermorelin",
        "category": "performance",
        "form": "injectable",
        "goals": ["energy", "longevity"],
        "mechanism_tags": [],
        "description": "GHRH analog that stimulates pituitary GH release. Used for anti-aging and body composition.",
    },
    {
        "name": "PT-141 (Bremelanotide)",
        "category": "therapeutic",
        "form": "injectable",
        "goals": [],
        "mechanism_tags": [],
        "description": "Melanocortin receptor agonist. FDA-approved for hypoactive sexual desire disorder in women.",
    },
    {
        "name": "Selank",
        "category": "therapeutic",
        "form": "nasal",
        "goals": ["stress", "cognitive performance"],
        "mechanism_tags": ["neuroprotective"],
        "description": "Synthetic tuftsin analog with anxiolytic and nootropic effects. Modulates GABA and serotonin.",
    },
    {
        "name": "Semax",
        "category": "therapeutic",
        "form": "nasal",
        "goals": ["cognitive performance"],
        "mechanism_tags": ["neuroprotective"],
        "description": "Synthetic ACTH analog that enhances BDNF expression. Used for cognitive enhancement and neuroprotection.",
    },
    {
        "name": "Semaglutide",
        "category": "therapeutic",
        "form": "injectable",
        "goals": ["weight management"],
        "mechanism_tags": [],
        "description": "GLP-1 receptor agonist. FDA-approved for weight management and type 2 diabetes.",
    },
    {
        "name": "Tirzepatide",
        "category": "therapeutic",
        "form": "injectable",
        "goals": ["weight management"],
        "mechanism_tags": [],
        "description": "Dual GIP/GLP-1 receptor agonist. FDA-approved for type 2 diabetes and weight management.",
    },
    {
        "name": "LL-37",
        "category": "therapeutic",
        "form": "injectable",
        "goals": ["immunity"],
        "mechanism_tags": [],
        "description": "Antimicrobial peptide (cathelicidin) that supports innate immune defense against bacteria, viruses, and biofilms.",
    },
    {
        "name": "KPV",
        "category": "therapeutic",
        "form": "capsule",
        "goals": ["gut health"],
        "mechanism_tags": ["anti-inflammatory"],
        "description": "Tripeptide derived from alpha-MSH with potent anti-inflammatory effects, particularly in the gut.",
    },
    {
        "name": "Dihexa",
        "category": "research",
        "form": "capsule",
        "goals": ["cognitive performance"],
        "mechanism_tags": ["neuroprotective"],
        "description": "Angiotensin IV analog that promotes neurogenesis and synaptogenesis. Research compound for cognitive enhancement.",
    },
    {
        "name": "MOTS-c",
        "category": "research",
        "form": "injectable",
        "goals": ["energy", "longevity"],
        "mechanism_tags": ["mitochondrial support", "AMPK activator"],
        "description": "Mitochondria-derived peptide that activates AMPK, improves glucose metabolism, and enhances exercise capacity.",
    },
    {
        "name": "Humanin",
        "category": "research",
        "form": "injectable",
        "goals": ["longevity"],
        "mechanism_tags": ["mitochondrial support", "neuroprotective"],
        "description": "Mitochondria-derived peptide with cytoprotective effects. Protects against age-related diseases.",
    },
    {
        "name": "SS-31 (Elamipretide)",
        "category": "research",
        "form": "injectable",
        "goals": ["energy", "longevity"],
        "mechanism_tags": ["mitochondrial support"],
        "description": "Targets cardiolipin in the inner mitochondrial membrane, restoring electron transport chain function.",
    },
    {
        "name": "Pentosan Polysulfate (PPS)",
        "category": "therapeutic",
        "form": "injectable",
        "goals": ["joint health"],
        "mechanism_tags": ["anti-inflammatory"],
        "description": "Semi-synthetic glycosaminoglycan that supports joint health and cartilage repair. Used in veterinary and human medicine.",
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        now = datetime.now(timezone.utc)
        existing_supplement_names = {
            name
            for name in (
                await session.execute(select(Supplement.name))
            ).scalars().all()
        }
        existing_therapy_names = {
            name
            for name in (
                await session.execute(select(Therapy.name))
            ).scalars().all()
        }
        existing_medication_names = {
            name
            for name in (
                await session.execute(select(Medication.name))
            ).scalars().all()
        }
        existing_peptide_names = {
            name
            for name in (
                await session.execute(select(Peptide.name))
            ).scalars().all()
        }

        seeded_supplements = 0
        workbook_supplements = load_workbook_supplement_catalog(
            excluded_names={
                *(item["name"] for item in SUPPLEMENTS),
                *(item["name"] for item in SUPPLEMENT_CATALOG),
                *(item["name"] for item in MEDICATIONS),
                *(item["name"] for item in MEDICATION_CATALOG),
                *(item["name"] for item in PEPTIDES),
            },
        )
        all_supplements = SUPPLEMENTS + SUPPLEMENT_CATALOG + workbook_supplements
        for data in all_supplements:
            if data["name"] in existing_supplement_names:
                continue
            has_profile = data.get("ai_profile") is not None
            supplement = Supplement(
                name=data["name"],
                category=data["category"],
                form=data.get("form"),
                description=data.get("description"),
                goals=data.get("goals"),
                mechanism_tags=data.get("mechanism_tags"),
                ai_profile=data.get("ai_profile"),
                ai_profile_version=1 if has_profile else 0,
                ai_generated_at=now if has_profile else None,
                is_verified=has_profile,
            )
            session.add(supplement)
            existing_supplement_names.add(data["name"])
            seeded_supplements += 1

        seeded_therapies = 0
        for data in THERAPIES:
            if data["name"] in existing_therapy_names:
                continue
            therapy = Therapy(
                name=data["name"],
                category=data["category"],
                description=data["description"],
                ai_profile=data["ai_profile"],
                ai_profile_version=1,
                ai_generated_at=now,
            )
            session.add(therapy)
            existing_therapy_names.add(data["name"])
            seeded_therapies += 1

        seeded_medications = 0
        all_medications = MEDICATIONS + MEDICATION_CATALOG
        for data in all_medications:
            if data["name"] in existing_medication_names:
                continue
            has_profile = data.get("ai_profile") is not None
            medication = Medication(
                name=data["name"],
                category=data["category"],
                form=data.get("form"),
                description=data.get("description"),
                ai_profile=data.get("ai_profile"),
                ai_profile_version=1 if has_profile else 0,
                ai_generated_at=now if has_profile else None,
                is_verified=has_profile,
            )
            session.add(medication)
            existing_medication_names.add(data["name"])
            seeded_medications += 1

        seeded_peptides = 0
        for data in PEPTIDES:
            if data["name"] in existing_peptide_names:
                continue
            peptide = Peptide(
                name=data["name"],
                category=data["category"],
                form=data.get("form"),
                description=data.get("description"),
                goals=data.get("goals"),
                mechanism_tags=data.get("mechanism_tags"),
            )
            session.add(peptide)
            existing_peptide_names.add(data["name"])
            seeded_peptides += 1

        # Exercises (shared catalog — user_id=NULL)
        existing_exercise_names = {
            name
            for name in (
                await session.execute(select(Exercise.name).where(Exercise.user_id.is_(None)))
            ).scalars().all()
        }
        seeded_exercises = 0
        for data in EXERCISE_CATALOG:
            if data["name"] in existing_exercise_names:
                continue
            exercise = Exercise(
                name=data["name"],
                category=data["category"],
                primary_muscle=data["primary_muscle"],
                secondary_muscles=data.get("secondary_muscles"),
                equipment=data["equipment"],
                description=data.get("description"),
                instructions=data.get("instructions"),
                is_compound=data.get("is_compound", False),
            )
            session.add(exercise)
            seeded_exercises += 1

        await session.commit()
        await apply_manual_catalog_profiles()
        await apply_mirrors()
        supplement_count = (await session.execute(select(func.count()).select_from(Supplement))).scalar_one()
        therapy_count = (await session.execute(select(func.count()).select_from(Therapy))).scalar_one()
        medication_count = (await session.execute(select(func.count()).select_from(Medication))).scalar_one()
        peptide_count = (await session.execute(select(func.count()).select_from(Peptide))).scalar_one()
        exercise_count = (await session.execute(select(func.count()).select_from(Exercise))).scalar_one()
        print(
            f"Seeded {seeded_supplements} new supplements, {seeded_medications} new medications, "
            f"{seeded_therapies} new therapies, {seeded_peptides} new peptides, "
            f"and {seeded_exercises} new exercises. Synced manual supplement profiles and approved catalog mirrors. "
            f"Database now has {supplement_count} supplements, {medication_count} medications, "
            f"{therapy_count} therapies, {peptide_count} peptides, and {exercise_count} exercises."
        )


if __name__ == "__main__":
    asyncio.run(seed())
