from fastapi import APIRouter

from app.core.config import settings
from app.schemas.schemas import HealthResponse
from app.translation.semantic import semantic_matcher

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app_env=settings.APP_ENV,
        semantic_search_available=semantic_matcher.is_available,
    )
