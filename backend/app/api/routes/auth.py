"""
NEW FILE -- auth endpoints. Wired into the app with exactly two added
lines in app/main.py -- see SETUP_INSTRUCTIONS.md.

    POST  /api/auth/register   create a teacher/student account
    POST  /api/auth/login      exchange email+password for a token
    GET   /api/auth/me         current user's profile (requires token)
    PATCH /api/auth/me         update the current user's profile
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories import user_repo
from app.schemas.auth_schemas import LoginRequest, ProfileUpdateRequest, RegisterRequest, TokenResponse, UserOut
from app.services import auth_service
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user, token = auth_service.register(db, payload)
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user, token = auth_service.login(db, payload)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def read_profile(current_user: User = Depends(get_current_user)) -> UserOut:
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    return user_repo.update_profile(
        db,
        current_user,
        full_name=payload.full_name,
        school_name=payload.school_name,
        district=payload.district,
    )
