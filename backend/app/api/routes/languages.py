"""
MODIFIED FILE -- your existing backend/app/api/routes/languages.py with
one change, marked "NEW": requires a logged-in user, for consistency with
every other content route now that login is required app-wide.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_authenticated  # NEW
from app.models.user import User  # NEW
from app.repositories.translation_repo import get_all_languages
from app.schemas.schemas import LanguageOut

router = APIRouter(prefix="/languages", tags=["languages"])


@router.get("", response_model=list[LanguageOut])
def list_languages(
    current_user: User = Depends(require_authenticated),  # NEW
    db: Session = Depends(get_db),
) -> list[LanguageOut]:
    """Every language the platform knows about, including ones on the
    roadmap (status='planned') with no dataset yet -- e.g. Ho and Santali.
    The frontend uses `status` to grey these out rather than hide them,
    so it's clear the architecture already supports them."""
    return get_all_languages(db)
