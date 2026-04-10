from app.models.user_supplement import UserSupplement
from app.schemas.supplement import SupplementResponse, UserSupplementResponse
from app.services.ai_onboarding import resolve_ai_status


async def serialize_user_supplement(user_supplement: UserSupplement | None) -> UserSupplementResponse | None:
    if user_supplement is None:
        return None

    ai_status, ai_error = await resolve_ai_status(user_supplement.supplement)
    return UserSupplementResponse(
        id=user_supplement.id,
        supplement=SupplementResponse(
            id=user_supplement.supplement.id,
            name=user_supplement.supplement.name,
            category=user_supplement.supplement.category,
            source="catalog" if user_supplement.supplement.created_by_user_id is None else "user_created",
            form=user_supplement.supplement.form,
            description=user_supplement.supplement.description,
            goals=user_supplement.supplement.goals,
            mechanism_tags=user_supplement.supplement.mechanism_tags,
            ai_profile=user_supplement.supplement.ai_profile,
            ai_status=ai_status,
            ai_error=ai_error,
            ai_generated_at=user_supplement.supplement.ai_generated_at,
            is_verified=user_supplement.supplement.is_verified,
        ),
        dosage_amount=float(user_supplement.dosage_amount),
        dosage_unit=user_supplement.dosage_unit,
        frequency=user_supplement.frequency,
        take_window=user_supplement.take_window,
        with_food=user_supplement.with_food,
        is_out_of_stock=user_supplement.is_out_of_stock,
        notes=user_supplement.notes,
        is_active=user_supplement.is_active,
        started_at=user_supplement.started_at,
        ended_at=user_supplement.ended_at,
        created_at=user_supplement.created_at,
    )
