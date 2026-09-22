"""
Repository layer: the only place in the codebase that writes raw SQLAlchemy
queries for translation data. Services call this instead of touching the
ORM directly -- keeps `TranslationService` focused on pipeline logic and
makes the query layer independently testable/swappable (see
docs/architecture.md "Why this approach").
"""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Language, TranslationEntry, TranslationHistory


def get_language_by_code(db: Session, code: str) -> Language | None:
    return db.query(Language).filter(Language.code == code).first()


def get_all_languages(db: Session) -> list[Language]:
    return db.query(Language).order_by(Language.is_tribal, Language.name_en).all()


def get_entries_for_direction(db: Session, source_lang_id: int, target_lang_id: int) -> list[TranslationEntry]:
    return (
        db.query(TranslationEntry)
        .filter(
            TranslationEntry.source_language_id == source_lang_id,
            TranslationEntry.target_language_id == target_lang_id,
        )
        .all()
    )


def search_entries(
    db: Session,
    query_normalized: str,
    category: str | None,
    page: int,
    page_size: int,
) -> tuple[list[TranslationEntry], int]:
    q = db.query(TranslationEntry)
    if query_normalized:
        like = f"%{query_normalized}%"
        q = q.filter(
            (TranslationEntry.normalized_source.like(like))
            | (func.lower(TranslationEntry.target_text).like(like))
        )
    if category and category != "all":
        q = q.filter(TranslationEntry.category == category)
    total = q.count()
    results = (
        q.order_by(TranslationEntry.category, TranslationEntry.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return results, total


def get_entries_by_category(db: Session, category: str, limit: int = 50) -> list[TranslationEntry]:
    return (
        db.query(TranslationEntry)
        .filter(TranslationEntry.category == category)
        .order_by(TranslationEntry.id)
        .limit(limit)
        .all()
    )


def get_distinct_categories(db: Session) -> list[str]:
    rows = db.query(TranslationEntry.category).distinct().order_by(TranslationEntry.category).all()
    return [r[0] for r in rows]


def record_history(
    db: Session,
    source_text: str,
    result_text: str | None,
    source_language_code: str,
    target_language_code: str,
    method: str,
    confidence: float,
    matched_entry_id: int | None,
) -> TranslationHistory:
    history = TranslationHistory(
        source_text=source_text,
        result_text=result_text,
        source_language_code=source_language_code,
        target_language_code=target_language_code,
        method=method,
        confidence=confidence,
        matched_entry_id=matched_entry_id,
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


def category_counts(db: Session) -> dict[str, int]:
    rows = (
        db.query(TranslationEntry.category, func.count(TranslationEntry.id))
        .group_by(TranslationEntry.category)
        .all()
    )
    return {category: count for category, count in rows}
