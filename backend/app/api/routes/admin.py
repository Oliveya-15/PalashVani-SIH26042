"""Government/developer administration API.

Every endpoint in this module requires a database-backed user whose role is
exactly ``admin``.  The frontend is not a security boundary; these checks are
deliberately repeated on the server.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.admin import ContentSubmission, UserActivity
from app.models.models import Feedback, TranslationEntry
from app.models.user import User
from app.schemas.admin_schemas import (
    ActivityOut,
    AdminUserListResponse,
    AdminUserOut,
    ContentSubmissionOut,
    FeedbackAdminOut,
    OverviewResponse,
    ReviewDecision,
    UserRoleUpdate,
    UserStatusUpdate,
)
from app.services.activity_service import record_activity
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")
    return current_user


def _activity_rows(db: Session, limit: int = 10) -> list[ActivityOut]:
    rows = (
        db.query(UserActivity, User.full_name)
        .outerjoin(User, User.id == UserActivity.user_id)
        .order_by(UserActivity.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        ActivityOut(
            id=event.id,
            user_id=event.user_id,
            user_name=full_name,
            action=event.action,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            detail=event.detail,
            created_at=event.created_at,
        )
        for event, full_name in rows
    ]


@router.get("/overview", response_model=OverviewResponse)
def overview(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> OverviewResponse:
    total_users = db.query(func.count(User.id)).scalar() or 0
    return OverviewResponse(
        total_users=total_users,
        active_users=db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0,
        teacher_count=db.query(func.count(User.id)).filter(User.role == "teacher").scalar() or 0,
        student_count=db.query(func.count(User.id)).filter(User.role == "student").scalar() or 0,
        admin_count=db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0,
        pending_submissions=db.query(func.count(ContentSubmission.id)).filter(ContentSubmission.status == "pending").scalar() or 0,
        verified_entries=db.query(func.count(TranslationEntry.id)).filter(TranslationEntry.verified.is_(True)).scalar() or 0,
        feedback_count=db.query(func.count(Feedback.id)).scalar() or 0,
        recent_activity=_activity_rows(db),
    )


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    q: str = Query(default="", max_length=100),
    role: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserListResponse:
    query = db.query(User)
    if q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(User.full_name.ilike(term), User.email.ilike(term), User.school_name.ilike(term)))
    if role in {"teacher", "student", "admin"}:
        query = query.filter(User.role == role)
    if active is not None:
        query = query.filter(User.is_active.is_(active))
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return AdminUserListResponse(total=total, page=page, page_size=page_size, users=users)


@router.patch("/users/{user_id}/status", response_model=AdminUserOut)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_admin.id and not payload.is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own administrator account.")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    record_activity(
        db,
        "user_activated" if user.is_active else "user_suspended",
        user_id=current_admin.id,
        entity_type="user",
        entity_id=user.id,
        detail=user.email,
    )
    return user


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_admin.id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator role.")
    if user.role == "admin" and payload.role != "admin":
        admin_count = db.query(func.count(User.id)).filter(User.role == "admin", User.is_active.is_(True)).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Keep at least one active administrator account.")
    old_role = user.role
    user.role = payload.role
    db.commit()
    db.refresh(user)
    record_activity(
        db,
        "user_role_changed",
        user_id=current_admin.id,
        entity_type="user",
        entity_id=user.id,
        detail=f"{old_role} -> {user.role}",
    )
    return user


@router.get("/activity", response_model=list[ActivityOut])
def activity(
    limit: int = Query(default=50, ge=1, le=200),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ActivityOut]:
    return _activity_rows(db, limit)


@router.get("/content/submissions", response_model=list[ContentSubmissionOut])
def list_submissions(
    status_filter: str = Query(default="pending", alias="status"),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ContentSubmission]:
    query = db.query(ContentSubmission)
    if status_filter in {"pending", "approved", "rejected"}:
        query = query.filter(ContentSubmission.status == status_filter)
    return query.order_by(ContentSubmission.created_at.desc()).limit(200).all()


@router.post("/content/submissions/{submission_id}/approve", response_model=ContentSubmissionOut)
def approve_submission(
    submission_id: int,
    payload: ReviewDecision,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ContentSubmission:
    submission = db.get(ContentSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    if submission.status != "pending":
        raise HTTPException(status_code=409, detail="This submission has already been reviewed.")

    from app.repositories.translation_repo import get_language_by_code
    from app.translation.normalize import normalize_text

    source_language = get_language_by_code(db, submission.source_language_code)
    target_language = get_language_by_code(db, submission.target_language_code)
    if not source_language or not target_language:
        raise HTTPException(status_code=422, detail="The submitted language pair is not configured.")
    if submission.source_language_code == submission.target_language_code:
        raise HTTPException(status_code=422, detail="Source and target languages must be different.")

    existing = (
        db.query(TranslationEntry)
        .filter(
            TranslationEntry.source_text == submission.source_text,
            TranslationEntry.target_language_id == target_language.id,
        )
        .first()
    )
    if existing:
        existing.target_text = submission.target_text
        existing.normalized_source = normalize_text(submission.source_text)
        existing.transliteration = submission.transliteration
        existing.category = submission.category
        existing.source_citation = submission.source_citation
        existing.verified = True
        existing.chapter_id = submission.chapter_id
    else:
        db.add(
            TranslationEntry(
                source_language_id=source_language.id,
                target_language_id=target_language.id,
                source_text=submission.source_text,
                target_text=submission.target_text,
                normalized_source=normalize_text(submission.source_text),
                category=submission.category,
                transliteration=submission.transliteration,
                source_citation=submission.source_citation,
                verified=True,
                chapter_id=submission.chapter_id,
            )
        )
    submission.status = "approved"
    submission.review_note = payload.note.strip()
    submission.reviewed_by_id = current_admin.id
    submission.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    record_activity(
        db,
        "content_approved",
        user_id=current_admin.id,
        entity_type="content_submission",
        entity_id=submission.id,
        detail=submission.source_text[:80],
    )
    return submission


@router.post("/content/submissions/{submission_id}/reject", response_model=ContentSubmissionOut)
def reject_submission(
    submission_id: int,
    payload: ReviewDecision,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ContentSubmission:
    submission = db.get(ContentSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    if submission.status != "pending":
        raise HTTPException(status_code=409, detail="This submission has already been reviewed.")
    submission.status = "rejected"
    submission.review_note = payload.note.strip()
    submission.reviewed_by_id = current_admin.id
    submission.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    record_activity(
        db,
        "content_rejected",
        user_id=current_admin.id,
        entity_type="content_submission",
        entity_id=submission.id,
        detail=submission.source_text[:80],
    )
    return submission


@router.get("/feedback", response_model=list[FeedbackAdminOut])
def list_feedback(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[Feedback]:
    return db.query(Feedback).order_by(Feedback.created_at.desc()).limit(200).all()