from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories.translation_repo import get_all_languages
from app.schemas.schemas import LanguageOut

router = APIRouter(prefix="/languages", tags=["languages"])


@router.get("", response_model=list[LanguageOut])
def list_languages(db: Session = Depends(get_db)) -> list[LanguageOut]:
    """Every language the platform knows about, including ones on the
    roadmap (status='planned') with no dataset yet -- e.g. Ho and Santali.
    The frontend uses `status` to grey these out rather than hide them,
    so it's clear the architecture already supports them."""
    return get_all_languages(db)
