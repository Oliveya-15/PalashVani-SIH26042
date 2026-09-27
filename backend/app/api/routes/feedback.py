"""
MODIFIED FILE -- your existing backend/app/api/routes/feedback.py.
Changes, marked "NEW": requires a logged-in user, and attributes the
submission to them (Feedback.user_id) -- this is what makes feedback show
up with a real name/email in the admin panel's Feedback view instead of
being anonymous.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_authenticated  # NEW
from app.models.models import Feedback
from app.models.user import User  # NEW
from app.schemas.schemas import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(require_authenticated),  # NEW
    db: Session = Depends(get_db),
) -> FeedbackOut:
    feedback = Feedback(
        message=payload.message,
        rating=payload.rating,
        page=payload.page,
        translation_history_id=payload.translation_history_id,
        user_id=current_user.id,  # NEW
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
