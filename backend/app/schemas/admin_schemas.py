"""
NEW FILE -- request/response schemas for every /api/admin/* endpoint.
Kept separate from both schemas.py and auth_schemas.py so this update
touches neither of those existing files.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ------------------------------------------------------------- users --
class AdminUserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    school_name: str
    district: str
    is_active: bool
    created_at: datetime
    translation_count: int = 0  # how many translations this user has run -- real activity, not a guess
    feedback_count: int = 0

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    users: list[AdminUserOut]


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[Literal["teacher", "student", "admin"]] = None
    school_name: Optional[str] = Field(default=None, max_length=200)
    district: Optional[str] = Field(default=None, max_length=100)


# ---------------------------------------------------------- dataset --
class AdminDatasetEntryOut(BaseModel):
    id: int
    source_text: str
    target_text: str
    category: str
    transliteration: str
    source_citation: str
    verified: bool
    rights_cleared: bool
    rights_note: str
    target_language_code: str

    class Config:
        from_attributes = True


class AdminDatasetEntryListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    entries: list[AdminDatasetEntryOut]


class AdminDatasetEntryCreate(BaseModel):
    source_text: str = Field(..., min_length=1, max_length=1000)
    target_text: str = Field(..., min_length=1, max_length=1000)
    target_language_code: str = Field(default="mundari")
    category: str = Field(default="general", max_length=40)
    transliteration: str = Field(default="", max_length=200)
    source_citation: str = Field(..., min_length=1, max_length=300, description="Required: where this came from")
    verified: bool = False
    rights_cleared: bool = False  # NEW entries start unpublished until an admin explicitly clears them
    rights_note: str = Field(default="", max_length=300)


class AdminDatasetEntryUpdate(BaseModel):
    target_text: Optional[str] = Field(default=None, max_length=1000)
    category: Optional[str] = Field(default=None, max_length=40)
    transliteration: Optional[str] = Field(default=None, max_length=200)
    source_citation: Optional[str] = Field(default=None, max_length=300)
    verified: Optional[bool] = None
    rights_cleared: Optional[bool] = None
    rights_note: Optional[str] = Field(default=None, max_length=300)


# -------------------------------------------------------- curriculum --
class AdminChapterCreate(BaseModel):
    subject_id: int
    title_en: str = Field(..., min_length=1, max_length=120)
    title_hi: str = Field(..., min_length=1, max_length=120)
    order_index: int = 0


class AdminChapterUpdate(BaseModel):
    title_en: Optional[str] = Field(default=None, max_length=120)
    title_hi: Optional[str] = Field(default=None, max_length=120)
    order_index: Optional[int] = None


class AdminLinkEntryToChapter(BaseModel):
    entry_id: int
    chapter_id: Optional[int] = None  # None unlinks the entry from any chapter


# -------------------------------------------------------------- stats --
class RoleBreakdown(BaseModel):
    teacher: int
    student: int
    admin: int


class DashboardStatsResponse(BaseModel):
    generated_at: datetime
    total_users: int
    users_by_role: RoleBreakdown
    active_users_7d: int
    total_translations_served: int
    translations_last_7d: int
    total_dataset_entries: int
    entries_pending_rights_clearance: int
    total_feedback: int
    unread_feedback_note: str  # honest label since there's no "read" flag yet -- see docs/admin-notes.md


# ------------------------------------------------------------ feedback --
class AdminFeedbackOut(BaseModel):
    id: int
    message: str
    rating: Optional[int]
    page: str
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminFeedbackListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AdminFeedbackOut]


# ----------------------------------------------------------- audit log --
class AuditLogOut(BaseModel):
    id: int
    admin_user_id: int
    admin_name: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[int]
    details: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AuditLogOut]
