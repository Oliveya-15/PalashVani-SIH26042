"""
Pydantic v2 schemas -- the contract between the API and the frontend.
Kept separate from the ORM models (app/models/models.py) on purpose: the
API shape and the storage shape are allowed to evolve independently, which
is exactly the kind of decision worth being able to explain in a viva.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------- health --
class HealthResponse(BaseModel):
    status: str
    app_env: str
    semantic_search_available: bool


# ------------------------------------------------------------- languages --
class LanguageOut(BaseModel):
    id: int
    code: str
    name_en: str
    name_hi: str
    script: str
    is_tribal: bool
    status: str
    bhashini_supported: bool

    class Config:
        from_attributes = True


# ------------------------------------------------------------ translation --
class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    source_language: str = Field(default="hi", description="Language code, e.g. 'hi'")
    target_language: str = Field(default="mundari", description="Language code, e.g. 'mundari'")


class AlternativeSuggestion(BaseModel):
    text: str
    similarity: float


class TranslateResponse(BaseModel):
    input_text: str
    normalized_input: str
    result_text: Optional[str] = None
    method: str                     # exact | normalized | fuzzy | semantic | none
    confidence: float                # 0.0 - 1.0
    confidence_label: str            # high | medium | low | none
    verified: bool
    ai_assisted: bool
    message: str
    category: Optional[str] = None
    transliteration: Optional[str] = None
    source_citation: Optional[str] = None
    alternatives: List[AlternativeSuggestion] = []
    history_id: Optional[int] = None


# ----------------------------------------------------------------- search --
class SearchResultItem(BaseModel):
    id: int
    source_text: str
    target_text: str
    category: str
    transliteration: str
    source_citation: str
    verified: bool
    match_type: str   # exact | contains | fuzzy | semantic

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    query: str
    total: int
    page: int
    page_size: int
    results: List[SearchResultItem]


# -------------------------------------------------------------- dataset --
class DatasetStatsItem(BaseModel):
    language_code: str
    language_name_en: str
    language_name_hi: str
    total_pairs: int
    source: str
    license: str
    coverage_note: str
    last_updated: datetime
    status: str


class DatasetStatsResponse(BaseModel):
    generated_at: datetime
    total_verified_pairs: int
    languages: List[DatasetStatsItem]
    category_breakdown: dict[str, int]


# ----------------------------------------------------------- curriculum --
class ChapterOut(BaseModel):
    id: int
    title_en: str
    title_hi: str
    order_index: int
    unit_count: int

    class Config:
        from_attributes = True


class SubjectOut(BaseModel):
    id: int
    name_en: str
    name_hi: str
    icon: str
    chapters: List[ChapterOut]

    class Config:
        from_attributes = True


class GradeOut(BaseModel):
    id: int
    grade_number: int
    label_en: str
    label_hi: str
    subjects: List[SubjectOut]

    class Config:
        from_attributes = True


class ContentUnitOut(BaseModel):
    id: int
    source_text: str
    target_text: str
    transliteration: str
    category: str
    verified: bool

    class Config:
        from_attributes = True


class ChapterDetailOut(BaseModel):
    id: int
    title_en: str
    title_hi: str
    subject_name_en: str
    grade_number: int
    units: List[ContentUnitOut]


# ------------------------------------------------------------- flashcards --
class FlashcardOut(BaseModel):
    id: int
    source_text: str
    target_text: str
    transliteration: str
    category: str

    class Config:
        from_attributes = True


class FlashcardDeckResponse(BaseModel):
    category: str
    total: int
    cards: List[FlashcardOut]


# --------------------------------------------------------------- feedback --
class FeedbackCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    page: str = Field(default="general", max_length=60)
    translation_history_id: Optional[int] = None


class FeedbackOut(BaseModel):
    id: int
    message: str
    rating: Optional[int]
    page: str
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------ error --
class ErrorResponse(BaseModel):
    detail: str
