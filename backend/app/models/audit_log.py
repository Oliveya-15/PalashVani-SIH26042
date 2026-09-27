"""
NEW FILE -- records every admin action (user deactivated, dictionary entry
edited/rights-cleared/deleted, curriculum chapter changed, etc.).

This is what makes "activity and permission must be controlled from
admin" a real, auditable claim rather than a UI-only promise -- every
write an admin makes through the admin API is logged here automatically
(see app/services/audit_service.py), and the admin panel's Audit Log page
reads directly from this table.

Kept in its own file, the same way app/models/user.py was, so this update
adds a new table without touching the existing models.py beyond the three
column additions already explained there.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    admin_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(60))       # e.g. "user.deactivate", "dataset_entry.update"
    target_type: Mapped[str] = mapped_column(String(40))  # e.g. "user", "translation_entry", "chapter"
    target_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[str] = mapped_column(Text, default="")  # short human-readable summary of what changed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
