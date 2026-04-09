from fastapi import APIRouter

from app.routes.adherence import router as adherence_router
from app.routes.auth import router as auth_router
from app.routes.daily_plan import router as daily_plan_router
from app.routes.health import router as health_router
from app.routes.medications import router as medications_router
from app.routes.nutrition import router as nutrition_router
from app.routes.peptides import router as peptides_router
from app.routes.protocols import router as protocols_router
from app.routes.supplements import router as supplements_router
from app.routes.therapies import router as therapies_router
from app.routes.tracking import router as tracking_router
from app.routes.user_medications import router as user_medications_router
from app.routes.user_peptides import router as user_peptides_router
from app.routes.user_preferences import router as user_preferences_router
from app.routes.user_supplements import router as user_supplements_router
from app.routes.user_therapies import router as user_therapies_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(health_router)
v1_router.include_router(auth_router)
v1_router.include_router(supplements_router)
v1_router.include_router(medications_router)
v1_router.include_router(therapies_router)
v1_router.include_router(peptides_router)
v1_router.include_router(nutrition_router)
v1_router.include_router(user_supplements_router)
v1_router.include_router(user_medications_router)
v1_router.include_router(user_therapies_router)
v1_router.include_router(user_peptides_router)
v1_router.include_router(protocols_router)
v1_router.include_router(daily_plan_router)
v1_router.include_router(adherence_router)
v1_router.include_router(user_preferences_router)
v1_router.include_router(tracking_router)
