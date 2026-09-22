"""
Curriculum browsing service -- backs the "Browse by Chapter" screen from
the PPT's app sitemap (Grade -> Subject -> Chapter, mirroring the JCERT
tree). See scripts/seed_curriculum.py for how chapters are populated from
the same verified TranslationEntry rows used by search/translate (a
chapter is simply "a named, ordered subset of the corpus" -- see
docs/database.md for why no separate content table was created).
"""
from sqlalchemy.orm import Session, joinedload

from app.models.models import CurriculumChapter, CurriculumGrade, CurriculumSubject, TranslationEntry


def list_grades_with_subjects(db: Session) -> list[CurriculumGrade]:
    return (
        db.query(CurriculumGrade)
        .options(joinedload(CurriculumGrade.subjects).joinedload(CurriculumSubject.chapters))
        .order_by(CurriculumGrade.grade_number)
        .all()
    )


def get_chapter_detail(db: Session, chapter_id: int) -> CurriculumChapter | None:
    return (
        db.query(CurriculumChapter)
        .options(
            joinedload(CurriculumChapter.entries),
            joinedload(CurriculumChapter.subject).joinedload(CurriculumSubject.grade),
        )
        .filter(CurriculumChapter.id == chapter_id)
        .first()
    )


def unit_count(chapter: CurriculumChapter) -> int:
    return len(chapter.entries)
