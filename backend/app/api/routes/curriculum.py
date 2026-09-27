"""
MODIFIED FILE -- your existing backend/app/api/routes/curriculum.py.
Changes, marked "NEW" below: both routes now require a logged-in user, and
the chapter-detail route now excludes any entry pending rights clearance
(matching the same rule already applied in translation_repo.py). Route
paths and response shapes are unchanged.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_authenticated  # NEW
from app.models.user import User  # NEW
from app.schemas.schemas import ChapterDetailOut, ContentUnitOut, GradeOut, SubjectOut, ChapterOut
from app.services.curriculum_service import get_chapter_detail, list_grades_with_subjects

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/grades", response_model=list[GradeOut])
def get_grades(
    current_user: User = Depends(require_authenticated),  # NEW
    db: Session = Depends(get_db),
) -> list[GradeOut]:
    grades = list_grades_with_subjects(db)
    return [
        GradeOut(
            id=g.id,
            grade_number=g.grade_number,
            label_en=g.label_en,
            label_hi=g.label_hi,
            subjects=[
                SubjectOut(
                    id=s.id,
                    name_en=s.name_en,
                    name_hi=s.name_hi,
                    icon=s.icon,
                    chapters=[
                        ChapterOut(
                            id=c.id,
                            title_en=c.title_en,
                            title_hi=c.title_hi,
                            order_index=c.order_index,
                            unit_count=len([e for e in c.entries if e.rights_cleared]),  # NEW
                        )
                        for c in sorted(s.chapters, key=lambda c: c.order_index)
                    ],
                )
                for s in g.subjects
            ],
        )
        for g in grades
    ]


@router.get("/chapters/{chapter_id}", response_model=ChapterDetailOut)
def get_chapter(
    chapter_id: int,
    current_user: User = Depends(require_authenticated),  # NEW
    db: Session = Depends(get_db),
) -> ChapterDetailOut:
    chapter = get_chapter_detail(db, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found.")
    return ChapterDetailOut(
        id=chapter.id,
        title_en=chapter.title_en,
        title_hi=chapter.title_hi,
        subject_name_en=chapter.subject.name_en,
        grade_number=chapter.subject.grade.grade_number,
        units=[
            ContentUnitOut(
                id=e.id,
                source_text=e.source_text,
                target_text=e.target_text,
                transliteration=e.transliteration,
                category=e.category,
                verified=e.verified,
            )
            for e in chapter.entries
            if e.rights_cleared  # NEW
        ],
    )
