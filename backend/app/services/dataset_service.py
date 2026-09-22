"""
Dataset statistics service -- backs the Dataset & Offline page. Reports
real counts from the database; never fabricates numbers (see the project's
"no fake statistics" rule).
"""
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.models import DatasetMetadata, Language, TranslationEntry
from app.repositories.translation_repo import category_counts


def get_dataset_stats(db: Session):
    languages = db.query(Language).filter(Language.is_tribal.is_(True)).all()
    items = []
    total_verified = 0

    for lang in languages:
        meta = db.query(DatasetMetadata).filter(DatasetMetadata.language_id == lang.id).first()
        verified_count = (
            db.query(TranslationEntry)
            .filter(TranslationEntry.target_language_id == lang.id, TranslationEntry.verified.is_(True))
            .count()
        )
        total_verified += verified_count
        items.append({
            "language_code": lang.code,
            "language_name_en": lang.name_en,
            "language_name_hi": lang.name_hi,
            "total_pairs": meta.total_pairs if meta else verified_count,
            "source": meta.source if meta else "No dataset imported yet",
            "license": meta.license if meta else "",
            "coverage_note": meta.coverage_note if meta else "Pending corpus import.",
            "last_updated": meta.last_updated if meta else datetime.utcnow(),
            "status": lang.status,
        })

    return {
        "generated_at": datetime.utcnow(),
        "total_verified_pairs": total_verified,
        "languages": items,
        "category_breakdown": category_counts(db),
    }
