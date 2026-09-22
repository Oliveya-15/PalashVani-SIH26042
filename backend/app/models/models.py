"""
ORM models.

Schema summary (see docs/database.md for the full entity-relationship
explanation and rationale for every table):

  Language            -- every language the platform knows about (hi, en,
                          mundari, ho, santali...) incl. which ones actually
                          have data yet ("active") vs. are on the roadmap
                          ("planned").
  CurriculumGrade      -- Grade 1-5 (FLN target range per the PPT)
  CurriculumSubject    -- Subject within a grade (e.g. Language, Maths)
  CurriculumChapter     -- Chapter within a subject
  TranslationEntry      -- the actual parallel corpus (Hindi <-> tribal
                          language pairs). Optionally linked to a chapter
                          when it is also used as curriculum content --
                          this reuse avoids a duplicate "content unit"
                          table holding the same text twice.
  TranslationHistory    -- every translation the API served, with the
                          method/confidence that produced it (used by the
                          Dataset/Offline page's "recent activity" stats
                          and by academic/viva demonstration of the
                          pipeline).
  Feedback              -- free-text feedback from the /feedback page,
                          optionally linked to a translation.
  DatasetMetadata       -- one row per language describing where its data
                          came from, how much of it there is, and its
                          licence -- shown on the Dataset & Offline page.
"""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Language(Base):
    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)  # 'hi', 'en', 'mundari', 'ho', 'santali'
    name_en: Mapped[str] = mapped_column(String(80))
    name_hi: Mapped[str] = mapped_column(String(80))
    script: Mapped[str] = mapped_column(String(40), default="Devanagari")
    is_tribal: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="planned")  # 'active' | 'planned'
    bhashini_supported: Mapped[bool] = mapped_column(Boolean, default=False)

    dataset_meta: Mapped[list["DatasetMetadata"]] = relationship(back_populates="language")


class CurriculumGrade(Base):
    __tablename__ = "curriculum_grades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    grade_number: Mapped[int] = mapped_column(Integer, unique=True)
    label_en: Mapped[str] = mapped_column(String(40))
    label_hi: Mapped[str] = mapped_column(String(40))

    subjects: Mapped[list["CurriculumSubject"]] = relationship(back_populates="grade", cascade="all, delete-orphan")


class CurriculumSubject(Base):
    __tablename__ = "curriculum_subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    grade_id: Mapped[int] = mapped_column(ForeignKey("curriculum_grades.id"))
    name_en: Mapped[str] = mapped_column(String(80))
    name_hi: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(10), default="\U0001F4D8")  # book emoji fallback

    grade: Mapped["CurriculumGrade"] = relationship(back_populates="subjects")
    chapters: Mapped[list["CurriculumChapter"]] = relationship(back_populates="subject", cascade="all, delete-orphan")


class CurriculumChapter(Base):
    __tablename__ = "curriculum_chapters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("curriculum_subjects.id"))
    title_en: Mapped[str] = mapped_column(String(120))
    title_hi: Mapped[str] = mapped_column(String(120))
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    subject: Mapped["CurriculumSubject"] = relationship(back_populates="chapters")
    entries: Mapped[list["TranslationEntry"]] = relationship(back_populates="chapter")


class TranslationEntry(Base):
    """One row of the Hindi <-> tribal-language parallel corpus."""

    __tablename__ = "translation_entries"
    __table_args__ = (
        Index("ix_translation_entries_normalized", "normalized_source"),
        UniqueConstraint("source_text", "target_language_id", name="uq_source_per_target_lang"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_language_id: Mapped[int] = mapped_column(ForeignKey("languages.id"))
    target_language_id: Mapped[int] = mapped_column(ForeignKey("languages.id"))

    source_text: Mapped[str] = mapped_column(Text)          # Hindi
    target_text: Mapped[str] = mapped_column(Text)          # Mundari (or other tribal language)
    normalized_source: Mapped[str] = mapped_column(Text)    # lower/NFC/punctuation-stripped, for fast lookup

    category: Mapped[str] = mapped_column(String(40), default="general")
    transliteration: Mapped[str] = mapped_column(String(200), default="")
    source_citation: Mapped[str] = mapped_column(String(300), default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    chapter_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_chapters.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source_language: Mapped["Language"] = relationship(foreign_keys=[source_language_id])
    target_language: Mapped["Language"] = relationship(foreign_keys=[target_language_id])
    chapter: Mapped["CurriculumChapter | None"] = relationship(back_populates="entries")


class TranslationHistory(Base):
    """Every translation served by POST /api/translations, for transparency + stats."""

    __tablename__ = "translation_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_text: Mapped[str] = mapped_column(Text)
    result_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_language_code: Mapped[str] = mapped_column(String(20))
    target_language_code: Mapped[str] = mapped_column(String(20))
    method: Mapped[str] = mapped_column(String(30))          # exact | normalized | fuzzy | semantic | none
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    matched_entry_id: Mapped[int | None] = mapped_column(ForeignKey("translation_entries.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message: Mapped[str] = mapped_column(Text)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5, optional
    page: Mapped[str] = mapped_column(String(60), default="general")
    translation_history_id: Mapped[int | None] = mapped_column(ForeignKey("translation_history.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    language_id: Mapped[int] = mapped_column(ForeignKey("languages.id"))
    total_pairs: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[str] = mapped_column(String(300))
    license: Mapped[str] = mapped_column(String(120), default="")
    coverage_note: Mapped[str] = mapped_column(Text, default="")
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    language: Mapped["Language"] = relationship(back_populates="dataset_meta")
