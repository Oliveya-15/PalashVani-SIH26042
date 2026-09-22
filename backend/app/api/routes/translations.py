from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.repositories import translation_repo
from app.schemas.schemas import (
    SearchResponse,
    SearchResultItem,
    TranslateRequest,
    TranslateResponse,
)
from app.services.translation_service import translate as run_translation
from app.translation.normalize import normalize_text

router = APIRouter(prefix="/translations", tags=["translations"])


@router.post("", response_model=TranslateResponse)
def translate_text(payload: TranslateRequest, db: Session = Depends(get_db)) -> TranslateResponse:
    return run_translation(db, payload.text, payload.source_language, payload.target_language)


@router.get("/search", response_model=SearchResponse)
def search_translations(
    q: str = Query(default="", max_length=200),
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.SEARCH_DEFAULT_PAGE_SIZE, ge=1, le=settings.SEARCH_MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
) -> SearchResponse:
    normalized_query = normalize_text(q)
    entries, total = translation_repo.search_entries(db, normalized_query, category, page, page_size)

    results = [
        SearchResultItem(
            id=e.id,
            source_text=e.source_text,
            target_text=e.target_text,
            category=e.category,
            transliteration=e.transliteration,
            source_citation=e.source_citation,
            verified=e.verified,
            match_type="exact" if e.normalized_source == normalized_query else "contains",
        )
        for e in entries
    ]
    return SearchResponse(query=q, total=total, page=page, page_size=page_size, results=results)


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)) -> list[str]:
    return translation_repo.get_distinct_categories(db)
