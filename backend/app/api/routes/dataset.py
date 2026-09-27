"""
MODIFIED FILE -- your existing backend/app/api/routes/dataset.py with one
change, marked "NEW": this endpoint now requires a teacher or admin
account (not student). This is the one concrete "teacher can do something
a student can't" differentiation -- see docs/admin-notes.md "What
teachers can do that students can't" for the reasoning and its one honest
caveat (the underlying search/flashcard data this page also uses for
offline downloads is still reachable by students through the Dictionary
and Flashcards features themselves).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_teacher_or_admin  # NEW
from app.models.user import User  # NEW
from app.schemas.schemas import DatasetStatsResponse
from app.services.dataset_service import get_dataset_stats

router = APIRouter(prefix="/dataset", tags=["dataset"])


@router.get("/stats", response_model=DatasetStatsResponse)
def dataset_stats(
    current_user: User = Depends(require_teacher_or_admin),  # NEW
    db: Session = Depends(get_db),
) -> DatasetStatsResponse:
    return get_dataset_stats(db)
