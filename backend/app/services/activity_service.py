"""Small, centralised audit-log helper for security-sensitive actions."""
from sqlalchemy.orm import Session

from app.models.admin import UserActivity


def record_activity(
    db: Session,
    action: str,
    *,
    user_id: int | None = None,
    entity_type: str = "",
    entity_id: int | None = None,
    detail: str = "",
    ip_address: str = "",
) -> UserActivity:
    event = UserActivity(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail[:500],
        ip_address=ip_address[:64],
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event