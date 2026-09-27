"""
NEW FILE -- admin-only curriculum management: create/edit chapters within
an existing subject, and link or unlink dataset entries to/from a chapter.
Reuses the same Grade -> Subject -> Chapter tables from the original
project (unchanged) -- this only adds write access to them.

    POST   /api/admin/curriculum/chapters              create a chapter
    PATCH  /api/admin/curriculum/chapters/{id}          edit a chapter
    DELETE /api/admin/curriculum/chapters/{id}          delete a chapter (unlinks its entries first)
    POST   /api/admin/curriculum/link-entry             link/unlink one dataset entry to a chapter
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_admin
from app.models.models import CurriculumChapter, CurriculumSubject
from app.models.user import User
from app.repositories import admin_repo
from app.schemas.admin_schemas import AdminChapterCreate, AdminChapterUpdate, AdminLinkEntryToChapter
from app.schemas.schemas import ChapterOut
from app.services.audit_service import log_action

router = APIRouter(prefix="/admin/curriculum", tags=["admin"])


@router.post("/chapters", response_model=ChapterOut, status_code=201)
def create_chapter(
    payload: AdminChapterCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)
) -> ChapterOut:
    subject = db.query(CurriculumSubject).filter(CurriculumSubject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found.")

    chapter = CurriculumChapter(
        subject_id=payload.subject_id,
        title_en=payload.title_en,
        title_hi=payload.title_hi,
        order_index=payload.order_index,
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)

    log_action(db, admin.id, "chapter.create", "chapter", chapter.id, chapter.title_en)
    return ChapterOut(id=chapter.id, title_en=chapter.title_en, title_hi=chapter.title_hi,
                       order_index=chapter.order_index, unit_count=0)


@router.patch("/chapters/{chapter_id}", response_model=ChapterOut)
def update_chapter(
    chapter_id: int,
    payload: AdminChapterUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ChapterOut:
    chapter = admin_repo.get_chapter(db, chapter_id)
    if not chapter:
        raise HTTPException(404, "Chapter not found.")

    if payload.title_en is not None:
        chapter.title_en = payload.title_en
    if payload.title_hi is not None:
        chapter.title_hi = payload.title_hi
    if payload.order_index is not None:
        chapter.order_index = payload.order_index
    db.commit()
    db.refresh(chapter)

    log_action(db, admin.id, "chapter.update", "chapter", chapter.id, chapter.title_en)
    return ChapterOut(id=chapter.id, title_en=chapter.title_en, title_hi=chapter.title_hi,
                       order_index=chapter.order_index, unit_count=len(chapter.entries))


@router.delete("/chapters/{chapter_id}", status_code=204)
def delete_chapter(chapter_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> None:
    chapter = admin_repo.get_chapter(db, chapter_id)
    if not chapter:
        raise HTTPException(404, "Chapter not found.")
    for entry in chapter.entries:
        entry.chapter_id = None  # unlink rather than delete the underlying corpus rows
    title = chapter.title_en
    db.delete(chapter)
    db.commit()
    log_action(db, admin.id, "chapter.delete", "chapter", chapter_id, title)


@router.post("/link-entry", status_code=204)
def link_entry_to_chapter(
    payload: AdminLinkEntryToChapter, admin: User = Depends(require_admin), db: Session = Depends(get_db)
) -> None:
    entry = admin_repo.get_dataset_entry(db, payload.entry_id)
    if not entry:
        raise HTTPException(404, "Dataset entry not found.")
    if payload.chapter_id is not None and not admin_repo.get_chapter(db, payload.chapter_id):
        raise HTTPException(404, "Chapter not found.")

    entry.chapter_id = payload.chapter_id
    db.commit()
    log_action(
        db, admin.id, "chapter.link_entry", "translation_entry", entry.id,
        f"chapter_id -> {payload.chapter_id}",
    )
