from app.models.user_therapy import UserTherapy
from app.schemas.therapy import TherapyResponse, UserTherapyResponse


async def serialize_user_therapy(user_therapy: UserTherapy | None) -> UserTherapyResponse | None:
    if user_therapy is None:
        return None

    return UserTherapyResponse(
        id=user_therapy.id,
        therapy=TherapyResponse(
            id=user_therapy.therapy.id,
            name=user_therapy.therapy.name,
            category=user_therapy.therapy.category,
            description=user_therapy.therapy.description,
            ai_profile=user_therapy.therapy.ai_profile,
            ai_generated_at=user_therapy.therapy.ai_generated_at,
        ),
        duration_minutes=user_therapy.duration_minutes,
        frequency=user_therapy.frequency,
        take_window=user_therapy.take_window,
        settings=user_therapy.settings,
        notes=user_therapy.notes,
        is_active=user_therapy.is_active,
        started_at=user_therapy.started_at,
        ended_at=user_therapy.ended_at,
        created_at=user_therapy.created_at,
    )
