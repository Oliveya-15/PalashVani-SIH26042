from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories.translation_repo import get_distinct_categories, get_entries_by_category
from app.schemas.schemas import FlashcardDeckResponse, FlashcardOut

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.get("/categories", response_model=list[str])
def flashcard_categories(db: Session = Depends(get_db)) -> list[str]:
    """Flashcards reuse the same verified corpus as Search/Translate, grouped
    by category (numbers, animals, colors...) -- see docs/database.md for
    why there is no separate flashcards table."""
    return get_distinct_categories(db)


@router.get("/deck", response_model=FlashcardDeckResponse)
def flashcard_deck(
    category: str = Query(..., min_length=1),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
) -> FlashcardDeckResponse:
    entries = get_entries_by_category(db, category, limit=limit)
    cards = [
        FlashcardOut(
            id=e.id,
            source_text=e.source_text,
            target_text=e.target_text,
            transliteration=e.transliteration,
            category=e.category,
        )
        for e in entries
    ]
    return FlashcardDeckResponse(category=category, total=len(cards), cards=cards)
