"""
NEW FILE -- DB access for every admin operation: users, dataset entries,
curriculum, feedback, and dashboard stats. Kept in one file (mirroring how
translation_repo.py already covers several related concerns) rather than
four near-empty files.

Note on Feedback/TranslationHistory joins: rather than add ORM
`relationship()` attributes to the existing User/Feedback/TranslationHistory
classes (which would be one more thing layered onto models.py beyond the
three documented column additions), user names for feedback/activity views
are looked up with a plain second query and merged in Python -- see
`list_feedback` below. Simpler to read, and there's no performance concern
at this project's scale.
"""
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.models import CurriculumChapter, Feedback, TranslationEntry, TranslationHistory
from app.models.user import User


# ---------------------------------------------------------------- users --
def list_users(
    db: Session, role: str | None, search: str | None, page: int, page_size: int
) -> tuple[list[User], int]:
    q = db.query(User)
    if role and role != "all":
        q = q.filter(User.role == role)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter((func.lower(User.full_name).like(like)) | (func.lower(User.email).like(like)))
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return users, total


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def user_activity_counts(db: Session, user_id: int) -> tuple[int, int]:
    translation_count = db.query(TranslationHistory).filter(TranslationHistory.user_id == user_id).count()
    feedback_count = db.query(Feedback).filter(Feedback.user_id == user_id).count()
    return translation_count, feedback_count


# -------------------------------------------------------------- dataset --
def list_dataset_entries(
    db: Session, category: str | None, rights_status: str | None, search: str | None, page: int, page_size: int
) -> tuple[list[TranslationEntry], int]:
    q = db.query(TranslationEntry)
    if category and category != "all":
        q = q.filter(TranslationEntry.category == category)
    if rights_status == "cleared":
        q = q.filter(TranslationEntry.rights_cleared.is_(True))
    elif rights_status == "pending":
        q = q.filter(TranslationEntry.rights_cleared.is_(False))
    if search:
        like = f"%{search}%"
        q = q.filter((TranslationEntry.source_text.like(like)) | (TranslationEntry.target_text.like(like)))
    total = q.count()
    entries = q.order_by(TranslationEntry.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return entries, total


def get_dataset_entry(db: Session, entry_id: int) -> TranslationEntry | None:
    return db.query(TranslationEntry).filter(TranslationEntry.id == entry_id).first()


# ----------------------------------------------------------- curriculum --
def get_chapter(db: Session, chapter_id: int) -> CurriculumChapter | None:
    return (
        db.query(CurriculumChapter)
        .options(joinedload(CurriculumChapter.entries))
        .filter(CurriculumChapter.id == chapter_id)
        .first()
    )


# ------------------------------------------------------------- feedback --
def list_feedback(db: Session, page: int, page_size: int) -> tuple[list[Feedback], dict[int, User], int]:
    q = db.query(Feedback)
    total = q.count()
    items = q.order_by(Feedback.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    user_ids = {f.user_id for f in items if f.user_id is not None}
    users_by_id = {}
    if user_ids:
        for u in db.query(User).filter(User.id.in_(user_ids)).all():
            users_by_id[u.id] = u
    return items, users_by_id, total


# ---------------------------------------------------------------- stats --
def dashboard_stats(db: Session) -> dict:
    total_users = db.query(User).count()
    by_role = {
        role: db.query(User).filter(User.role == role).count()
        for role in ("teacher", "student", "admin")
    }
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    active_users_7d = (
        db.query(TranslationHistory.user_id)
        .filter(TranslationHistory.created_at >= seven_days_ago, TranslationHistory.user_id.isnot(None))
        .distinct()
        .count()
    )
    total_translations = db.query(TranslationHistory).count()
    translations_7d = db.query(TranslationHistory).filter(TranslationHistory.created_at >= seven_days_ago).count()
    total_entries = db.query(TranslationEntry).count()
    pending_entries = db.query(TranslationEntry).filter(TranslationEntry.rights_cleared.is_(False)).count()
    total_feedback = db.query(Feedback).count()

    return {
        "generated_at": datetime.utcnow(),
        "total_users": total_users,
        "users_by_role": by_role,
        "active_users_7d": active_users_7d,
        "total_translations_served": total_translations,
        "translations_last_7d": translations_7d,
        "total_dataset_entries": total_entries,
        "entries_pending_rights_clearance": pending_entries,
        "total_feedback": total_feedback,
        "unread_feedback_note": (
            "Feedback has no read/unread tracking yet -- every submission is shown chronologically "
            "on the Feedback page. See docs/admin-notes.md for this scope note."
        ),
    }
