"""Seed protocol templates — curated protocol blueprints for common health goals."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, engine, async_session_factory
from app.models.protocol_template import ProtocolTemplate

TEMPLATES = [
    {
        "name": "Longevity Essentials",
        "description": "Core longevity stack based on the most evidence-backed supplements for healthspan extension. Covers NAD+ support, senolytics, mitochondrial health, and key micronutrients.",
        "category": "longevity",
        "difficulty": "beginner",
        "icon": "heartbeat",
        "is_featured": True,
        "sort_order": 1,
        "tags": ["longevity", "anti-aging", "healthspan", "evidence-based"],
        "items": [
            {"type": "supplement", "catalog_name": "NMN", "dosage": "500 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Resveratrol", "dosage": "500 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Vitamin D3", "dosage": "5000 IU", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Omega-3 (Fish Oil)", "dosage": "2 g", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Magnesium Threonate", "dosage": "144 mg", "take_window": "bedtime", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Quercetin", "dosage": "500 mg", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Deep Sleep Protocol",
        "description": "Optimize sleep quality and duration with targeted supplements for GABA support, melatonin rhythm, and nervous system relaxation.",
        "category": "sleep",
        "difficulty": "beginner",
        "icon": "moon-o",
        "is_featured": True,
        "sort_order": 2,
        "tags": ["sleep", "recovery", "relaxation", "GABA"],
        "items": [
            {"type": "supplement", "catalog_name": "Magnesium Threonate", "dosage": "144 mg", "take_window": "bedtime", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "L-Theanine", "dosage": "200 mg", "take_window": "bedtime", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Apigenin", "dosage": "50 mg", "take_window": "bedtime", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Glycine", "dosage": "3 g", "take_window": "bedtime", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Tart Cherry Extract", "dosage": "500 mg", "take_window": "evening", "frequency": "daily"},
        ],
    },
    {
        "name": "Cognitive Enhancement",
        "description": "Boost focus, memory, and mental clarity with nootropics and neuroprotective compounds.",
        "category": "cognitive",
        "difficulty": "intermediate",
        "icon": "bolt",
        "is_featured": True,
        "sort_order": 3,
        "tags": ["cognitive", "focus", "memory", "nootropic", "brain"],
        "items": [
            {"type": "supplement", "catalog_name": "Lion's Mane", "dosage": "1000 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Alpha-GPC", "dosage": "300 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Bacopa Monnieri", "dosage": "300 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Omega-3 (Fish Oil)", "dosage": "2 g", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "L-Theanine", "dosage": "100 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Creatine Monohydrate", "dosage": "5 g", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Mitochondrial Power",
        "description": "Enhance cellular energy production and mitochondrial biogenesis for sustained physical and mental energy.",
        "category": "energy",
        "difficulty": "intermediate",
        "icon": "flash",
        "is_featured": False,
        "sort_order": 4,
        "tags": ["energy", "mitochondria", "ATP", "CoQ10", "NAD+"],
        "items": [
            {"type": "supplement", "catalog_name": "CoQ10", "dosage": "200 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "NMN", "dosage": "500 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "PQQ", "dosage": "20 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Alpha-Lipoic Acid", "dosage": "300 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Creatine Monohydrate", "dosage": "5 g", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "D-Ribose", "dosage": "5 g", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Immune Shield",
        "description": "Strengthen immune resilience with key vitamins, minerals, and antimicrobial botanicals.",
        "category": "immune",
        "difficulty": "beginner",
        "icon": "shield",
        "is_featured": False,
        "sort_order": 5,
        "tags": ["immune", "vitamin C", "zinc", "antimicrobial"],
        "items": [
            {"type": "supplement", "catalog_name": "Vitamin C", "dosage": "1000 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Zinc", "dosage": "30 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Vitamin D3", "dosage": "5000 IU", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Quercetin", "dosage": "500 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Elderberry", "dosage": "500 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "N-Acetyl Cysteine (NAC)", "dosage": "600 mg", "take_window": "morning_fasted", "frequency": "daily"},
        ],
    },
    {
        "name": "Gut Restoration",
        "description": "Repair and optimize gut health with prebiotics, probiotics, and gut-lining support.",
        "category": "gut",
        "difficulty": "beginner",
        "icon": "leaf",
        "is_featured": False,
        "sort_order": 6,
        "tags": ["gut", "microbiome", "probiotics", "digestion"],
        "items": [
            {"type": "supplement", "catalog_name": "Probiotics", "dosage": "50B CFU", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "L-Glutamine", "dosage": "5 g", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Butyrate", "dosage": "300 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Acacia Fiber", "dosage": "5 g", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Zinc Carnosine", "dosage": "75 mg", "take_window": "morning_fasted", "frequency": "daily"},
        ],
    },
    {
        "name": "Cardiovascular Support",
        "description": "Support heart health, blood pressure, and vascular function with targeted nutrients.",
        "category": "cardiovascular",
        "difficulty": "intermediate",
        "icon": "heart",
        "is_featured": False,
        "sort_order": 7,
        "tags": ["cardiovascular", "heart", "blood pressure", "vascular"],
        "items": [
            {"type": "supplement", "catalog_name": "Omega-3 (Fish Oil)", "dosage": "3 g", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "CoQ10", "dosage": "200 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Magnesium Taurate", "dosage": "400 mg", "take_window": "evening", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Bergamot", "dosage": "500 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Beetroot Juice", "dosage": "250 ml", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Vitamin K2", "dosage": "200 mcg", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Skin & Hair Rejuvenation",
        "description": "Nourish skin elasticity, collagen production, and hair growth from within.",
        "category": "skin",
        "difficulty": "beginner",
        "icon": "star",
        "is_featured": False,
        "sort_order": 8,
        "tags": ["skin", "hair", "collagen", "anti-aging"],
        "items": [
            {"type": "supplement", "catalog_name": "Collagen Peptides", "dosage": "10 g", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Vitamin C", "dosage": "1000 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Biotin", "dosage": "5000 mcg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Astaxanthin", "dosage": "12 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Hyaluronic Acid", "dosage": "200 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Silica", "dosage": "10 mg", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Stress & Adaptation",
        "description": "Build resilience to stress with adaptogenic herbs and calming compounds.",
        "category": "recovery",
        "difficulty": "beginner",
        "icon": "tree",
        "is_featured": False,
        "sort_order": 9,
        "tags": ["stress", "adaptogen", "cortisol", "recovery", "calm"],
        "items": [
            {"type": "supplement", "catalog_name": "Ashwagandha KSM-66", "dosage": "600 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Rhodiola Rosea", "dosage": "300 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "L-Theanine", "dosage": "200 mg", "take_window": "afternoon", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Magnesium Glycinate", "dosage": "400 mg", "take_window": "bedtime", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Holy Basil (Tulsi)", "dosage": "500 mg", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Advanced Longevity + Rx",
        "description": "Comprehensive longevity protocol combining supplements with evidence-backed medications. Consult your physician.",
        "category": "longevity",
        "difficulty": "advanced",
        "icon": "flask",
        "is_featured": True,
        "sort_order": 10,
        "tags": ["longevity", "advanced", "prescription", "senolytic"],
        "items": [
            {"type": "supplement", "catalog_name": "NMN", "dosage": "1000 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Resveratrol", "dosage": "1000 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Spermidine", "dosage": "6 mg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Fisetin", "dosage": "500 mg", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "medication", "catalog_name": "Metformin", "dosage": "500 mg", "take_window": "evening", "frequency": "daily"},
            {"type": "medication", "catalog_name": "Rapamycin (Sirolimus)", "dosage": "5 mg", "take_window": "morning_fasted", "frequency": "weekly"},
            {"type": "supplement", "catalog_name": "Omega-3 (Fish Oil)", "dosage": "3 g", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Vitamin D3", "dosage": "5000 IU", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Recovery & Repair",
        "description": "Accelerate post-workout recovery and tissue repair with targeted peptides and supplements.",
        "category": "recovery",
        "difficulty": "advanced",
        "icon": "medkit",
        "is_featured": False,
        "sort_order": 11,
        "tags": ["recovery", "peptide", "repair", "muscle"],
        "items": [
            {"type": "peptide", "catalog_name": "BPC-157", "dosage": "250 mcg", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "peptide", "catalog_name": "TB-500 (Thymosin Beta-4)", "dosage": "2 mg", "take_window": "morning_fasted", "frequency": "weekly"},
            {"type": "supplement", "catalog_name": "Collagen Peptides", "dosage": "10 g", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "L-Glutamine", "dosage": "5 g", "take_window": "morning_fasted", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Creatine Monohydrate", "dosage": "5 g", "take_window": "morning_with_food", "frequency": "daily"},
        ],
    },
    {
        "name": "Starter Stack",
        "description": "The simplest, most impactful starting point for supplement newcomers. Just 3 essentials.",
        "category": "starter",
        "difficulty": "beginner",
        "icon": "rocket",
        "is_featured": True,
        "sort_order": 0,
        "tags": ["starter", "beginner", "essentials", "simple"],
        "items": [
            {"type": "supplement", "catalog_name": "Vitamin D3", "dosage": "5000 IU", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Omega-3 (Fish Oil)", "dosage": "2 g", "take_window": "morning_with_food", "frequency": "daily"},
            {"type": "supplement", "catalog_name": "Magnesium Glycinate", "dosage": "400 mg", "take_window": "bedtime", "frequency": "daily"},
        ],
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Check if templates already exist
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(ProtocolTemplate))
        count = result.scalar()
        if count and count > 0:
            print(f"Templates already seeded ({count} templates). Skipping.")
            return

        for data in TEMPLATES:
            template = ProtocolTemplate(**data)
            session.add(template)

        await session.commit()
        print(f"Seeded {len(TEMPLATES)} protocol templates.")


if __name__ == "__main__":
    asyncio.run(seed())
