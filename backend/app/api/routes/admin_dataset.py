"""
NEW FILE -- admin-only dictionary/dataset management. This is the
copyright-clearance gate: new entries are created with rights_cleared=False
by default (see AdminDatasetEntryCreate's default) and stay invisible to
the public app until an admin explicitly reviews the source citation and
sets rights_cleared=True. Every write is audit-logged.

    GET    /api/admin/dataset             search/filter every entry (incl. unpublished)
    POST   /api/admin/dataset             add a new entry (starts unpublished)
    PATCH  /api/admin/dataset/{id}        edit / verify / clear-or-revoke rights / delete-note
    DELETE /api/admin/dataset/{id}        remove an entry entirely
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_admin
from app.models.models import Language, TranslationEntry
from app.models.user import User
from app.repositories import admin_repo
from app.schemas.admin_schemas import (
    AdminDatasetEntryCreate,
    AdminDatasetEntryListResponse,
    AdminDatasetEntryOut,
    AdminDatasetEntryUpdate,
)
from app.services.audit_service import log_action
from app.translation.normalize import normalize_text

router = APIRouter(prefix="/admin/dataset", tags=["admin"])


def _to_out(entry: TranslationEntry) -> AdminDatasetEntryOut:
    return AdminDatasetEntryOut(
        id=entry.id,
        source_text=entry.source_text,
        target_text=entry.target_text,
        category=entry.category,
        transliteration=entry.transliteration,
        source_citation=entry.source_citation,
        verified=entry.verified,
        rights_cleared=entry.rights_cleared,
        rights_note=entry.rights_note,
        target_language_code=entry.target_language.code if entry.target_language else "",
    )


@router.get("", response_model=AdminDatasetEntryListResponse)
def list_entries(
    category: str | None = Query(default=None),
    rights_status: str | None = Query(default=None, description="'cleared' | 'pending' | omit for all"),
    search: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDatasetEntryListResponse:
    entries, total = admin_repo.list_dataset_entries(db, category, rights_status, search, page, page_size)
    return AdminDatasetEntryListResponse(
        total=total, page=page, page_size=page_size, entries=[_to_out(e) for e in entries]
    )


@router.post("", response_model=AdminDatasetEntryOut, status_code=201)
def create_entry(
    payload: AdminDatasetEntryCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDatasetEntryOut:
    target_lang = db.query(Language).filter(Language.code == payload.target_language_code).first()
    hindi_lang = db.query(Language).filter(Language.code == "hi").first()
    if not target_lang or not hindi_lang:
        raise HTTPException(400, f"Unknown language code '{payload.target_language_code}'.")

    entry = TranslationEntry(
        source_language_id=hindi_lang.id,
        target_language_id=target_lang.id,
        source_text=payload.source_text.strip(),
        target_text=payload.target_text.strip(),
        normalized_source=normalize_text(payload.source_text),
        category=payload.category,
        transliteration=payload.transliteration,
        source_citation=payload.source_citation,
        verified=payload.verified,
        rights_cleared=payload.rights_cleared,
        rights_note=payload.rights_note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    log_action(db, admin.id, "dataset_entry.create", "translation_entry", entry.id,
               f"'{entry.source_text}' -> '{entry.target_text}' (rights_cleared={entry.rights_cleared})")
    return _to_out(entry)


@router.patch("/{entry_id}", response_model=AdminDatasetEntryOut)
def update_entry(
    entry_id: int,
    payload: AdminDatasetEntryUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDatasetEntryOut:
    entry = admin_repo.get_dataset_entry(db, entry_id)
    if not entry:
        raise HTTPException(404, "Dataset entry not found.")

    changes = []
    for field in ("target_text", "category", "transliteration", "source_citation", "rights_note"):
        value = getattr(payload, field)
        if value is not None and value != getattr(entry, field):
            changes.append(f"{field} updated")
            setattr(entry, field, value)
    if payload.verified is not None and payload.verified != entry.verified:
        changes.append(f"verified -> {payload.verified}")
        entry.verified = payload.verified
    if payload.rights_cleared is not None and payload.rights_cleared != entry.rights_cleared:
        changes.append(f"rights_cleared -> {payload.rights_cleared}")
        entry.rights_cleared = payload.rights_cleared

    db.commit()
    db.refresh(entry)

    if changes:
        log_action(db, admin.id, "dataset_entry.update", "translation_entry", entry.id, "; ".join(changes))

    return _to_out(entry)


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> None:
    entry = admin_repo.get_dataset_entry(db, entry_id)
    if not entry:
        raise HTTPException(404, "Dataset entry not found.")
    summary = f"'{entry.source_text}' -> '{entry.target_text}'"
    db.delete(entry)
    db.commit()
    log_action(db, admin.id, "dataset_entry.delete", "translation_entry", entry_id, summary)
