"""
NEW FILE -- registration/login business logic + the `get_current_user`
FastAPI dependency that protected routes (e.g. GET/PATCH /api/auth/me)
use.

Why admin can't self-register (see app/models/user.py's docstring for the
role reasoning): a real government-run system would provision
departmental accounts through an internal process, not a public sign-up
form. `scripts/create_admin.py` (in this update package) is that internal
process for this project -- a one-time CLI command run directly against
the database, never exposed over HTTP.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth_schemas import LoginRequest, RegisterRequest

_bearer_scheme = HTTPBearer(auto_error=False)


def register(db: Session, payload: RegisterRequest) -> tuple[User, str]:
    if user_repo.get_by_email(db, payload.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    user = user_repo.create_user(
        db,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,  # schema type already restricts this to teacher|student
        school_name=payload.school_name or "",
        district=payload.district or "",
    )
    token = create_access_token(user.id, user.role)
    return user, token


def login(db: Session, payload: LoginRequest) -> tuple[User, str]:
    user = user_repo.get_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated.")
    token = create_access_token(user.id, user.role)
    return user, token


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated.")
    try:
        decoded = decode_access_token(credentials.credentials)
        user_id = int(decoded["sub"])
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session. Please log in again.")

    user = user_repo.get_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session. Please log in again.")
    return user
