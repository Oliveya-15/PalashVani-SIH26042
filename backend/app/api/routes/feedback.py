from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.models import Feedback
from app.schemas.schemas import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)) -> FeedbackOut:
    feedback = Feedback(
        message=payload.message,
        rating=payload.rating,
        page=payload.page,
        translation_history_id=payload.translation_history_id,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
