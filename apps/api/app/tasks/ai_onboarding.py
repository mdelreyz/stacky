from app.celery_app import celery_app
from app.services.ai_onboarding import run_ai_onboarding_job_sync


@celery_app.task(name="supplements.generate_ai_profile")
def generate_ai_profile(supplement_id: str) -> None:
    run_ai_onboarding_job_sync(supplement_id)
