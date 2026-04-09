from app.models.user_medication import UserMedication
from app.schemas.medication import MedicationResponse, UserMedicationResponse
from app.services.ai_onboarding import resolve_medication_ai_status


async def serialize_user_medication(user_medication: UserMedication | None) -> UserMedicationResponse | None:
    if user_medication is None:
        return None

    ai_status, ai_error = await resolve_medication_ai_status(user_medication.medication)
    return UserMedicationResponse(
        id=user_medication.id,
        medication=MedicationResponse(
            id=user_medication.medication.id,
            name=user_medication.medication.name,
            category=user_medication.medication.category,
            form=user_medication.medication.form,
            description=user_medication.medication.description,
            ai_profile=user_medication.medication.ai_profile,
            ai_status=ai_status,
            ai_error=ai_error,
            ai_generated_at=user_medication.medication.ai_generated_at,
            is_verified=user_medication.medication.is_verified,
        ),
        dosage_amount=float(user_medication.dosage_amount),
        dosage_unit=user_medication.dosage_unit,
        frequency=user_medication.frequency,
        take_window=user_medication.take_window,
        with_food=user_medication.with_food,
        notes=user_medication.notes,
        is_active=user_medication.is_active,
        started_at=user_medication.started_at,
        ended_at=user_medication.ended_at,
        created_at=user_medication.created_at,
    )
