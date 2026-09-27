"""
NEW FILE -- a single helper every admin-write route calls to record what
it did. Kept intentionally tiny (one function) so there's no excuse for an
admin route to skip logging -- see how it's used in
app/api/routes/admin_users.py, admin_dataset.py, and admin_curriculum.py.
"""
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    admin_user_id: int,
    action: str,
    target_type: str,
    target_id: int | None = None,
    details: str = "",
) -> None:
    db.add(AuditLog(
        admin_user_id=admin_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    ))
    db.commit()
