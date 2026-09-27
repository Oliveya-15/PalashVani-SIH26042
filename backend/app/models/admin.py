"""Models used by the governance/admin workflow.

The public learning experience stays read-only.  New dictionary or curriculum
content enters through ContentSubmission and is only copied into the live
TranslationEntry table after an admin reviews it.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class ContentSubmission(Base):
    __tablename__ = "content_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    submitted_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    content_type: Mapped[str] = mapped_column(String(30), default="dataset")
    source_language_code: Mapped[str] = mapped_column(String(20))
    target_language_code: Mapped[str] = mapped_column(String(20))
    source_text: Mapped[str] = mapped_column(Text)
    target_text: Mapped[str] = mapped_column(Text)
    transliteration: Mapped[str] = mapped_column(String(200), default="")
    category: Mapped[str] = mapped_column(String(40), default="general")
    source_citation: Mapped[str] = mapped_column(String(300), default="")
    license: Mapped[str] = mapped_column(String(120), default="")
    chapter_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_chapters.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    review_note: Mapped[str] = mapped_column(Text, default="")
    reviewed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class UserActivity(Base):
    __tablename__ = "user_activity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(60), index=True)
    entity_type: Mapped[str] = mapped_column(String(60), default="")
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[str] = mapped_column(String(500), default="")
    ip_address: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)