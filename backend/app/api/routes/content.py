"""Authenticated content intake. Nothing becomes live without admin review."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.admin import ContentSubmission
from app.models.user import User
from app.schemas.admin_schemas import ContentSubmissionCreate, ContentSubmissionOut
from app.services.activity_service import record_activity
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/content", tags=["content"])


def require_teacher_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in {"teacher", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and administrators can submit learning content.",
        )
    return current_user


@router.post("/submissions", response_model=ContentSubmissionOut, status_code=201)
def submit_content(
    payload: ContentSubmissionCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db),
) -> ContentSubmission:
    submission = ContentSubmission(
        submitted_by_id=current_user.id,
        content_type=payload.content_type,
        source_language_code=payload.source_language_code.lower().strip(),
        target_language_code=payload.target_language_code.lower().strip(),
        source_text=payload.source_text.strip(),
        target_text=payload.target_text.strip(),
        transliteration=payload.transliteration.strip(),
        category=payload.category.strip() or "general",
        source_citation=payload.source_citation.strip(),
        license=payload.license.strip(),
        chapter_id=payload.chapter_id,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    record_activity(
        db,
        "content_submitted",
        user_id=current_user.id,
        entity_type="content_submission",
        entity_id=submission.id,
        detail=f"{submission.content_type}: {submission.source_text[:80]}",
    )
    return submission