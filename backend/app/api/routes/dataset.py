from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.schemas import DatasetStatsResponse
from app.services.dataset_service import get_dataset_stats

router = APIRouter(prefix="/dataset", tags=["dataset"])


@router.get("/stats", response_model=DatasetStatsResponse)
def dataset_stats(db: Session = Depends(get_db)) -> DatasetStatsResponse:
    return get_dataset_stats(db)
