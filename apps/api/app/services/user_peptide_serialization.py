from app.models.user_peptide import UserPeptide
from app.schemas.peptide import PeptideResponse, UserPeptideResponse


async def serialize_user_peptide(user_peptide: UserPeptide | None) -> UserPeptideResponse | None:
    if user_peptide is None:
        return None

    return UserPeptideResponse(
        id=user_peptide.id,
        peptide=PeptideResponse(
            id=user_peptide.peptide.id,
            name=user_peptide.peptide.name,
            category=user_peptide.peptide.category,
            form=user_peptide.peptide.form,
            description=user_peptide.peptide.description,
            goals=user_peptide.peptide.goals,
            mechanism_tags=user_peptide.peptide.mechanism_tags,
            ai_profile=user_peptide.peptide.ai_profile,
            ai_generated_at=user_peptide.peptide.ai_generated_at,
            is_verified=user_peptide.peptide.is_verified,
        ),
        dosage_amount=float(user_peptide.dosage_amount),
        dosage_unit=user_peptide.dosage_unit,
        frequency=user_peptide.frequency,
        take_window=user_peptide.take_window,
        with_food=user_peptide.with_food,
        route=user_peptide.route,
        reconstitution=user_peptide.reconstitution,
        storage_notes=user_peptide.storage_notes,
        notes=user_peptide.notes,
        is_active=user_peptide.is_active,
        started_at=user_peptide.started_at,
        ended_at=user_peptide.ended_at,
        created_at=user_peptide.created_at,
    )
