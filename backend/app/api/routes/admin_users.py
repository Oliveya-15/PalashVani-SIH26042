"""
NEW FILE -- admin-only user management. Every write here is audit-logged
(see app/services/audit_service.py).

    GET   /api/admin/users            list/search/filter all accounts
    GET   /api/admin/users/{id}       one user + real activity counts
    PATCH /api/admin/users/{id}       activate/deactivate, change role, edit school/district
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_admin
from app.models.user import User
from app.repositories import admin_repo
from app.schemas.admin_schemas import AdminUserListResponse, AdminUserOut, AdminUserUpdate
from app.services.audit_service import log_action

router = APIRouter(prefix="/admin/users", tags=["admin"])


def _to_admin_user_out(db: Session, user: User) -> AdminUserOut:
    translation_count, feedback_count = admin_repo.user_activity_counts(db, user.id)
    return AdminUserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        school_name=user.school_name,
        district=user.district,
        is_active=user.is_active,
        created_at=user.created_at,
        translation_count=translation_count,
        feedback_count=feedback_count,
    )


@router.get("", response_model=AdminUserListResponse)
def list_users(
    role: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserListResponse:
    users, total = admin_repo.list_users(db, role, search, page, page_size)
    return AdminUserListResponse(
        total=total, page=page, page_size=page_size,
        users=[_to_admin_user_out(db, u) for u in users],
    )


@router.get("/{user_id}", response_model=AdminUserOut)
def get_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> AdminUserOut:
    user = admin_repo.get_user(db, user_id)
    if not user:
        raise HTTPException(404, "User not found.")
    return _to_admin_user_out(db, user)


@router.patch("/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserOut:
    user = admin_repo.get_user(db, user_id)
    if not user:
        raise HTTPException(404, "User not found.")
    if user.id == admin.id and payload.is_active is False:
        raise HTTPException(400, "You can't deactivate your own account.")
    if user.id == admin.id and payload.role is not None and payload.role != "admin":
        raise HTTPException(400, "You can't demote your own account.")

    changes = []
    if payload.is_active is not None and payload.is_active != user.is_active:
        user.is_active = payload.is_active
        changes.append(f"is_active -> {payload.is_active}")
    if payload.role is not None and payload.role != user.role:
        changes.append(f"role {user.role} -> {payload.role}")
        user.role = payload.role
    if payload.school_name is not None:
        user.school_name = payload.school_name
    if payload.district is not None:
        user.district = payload.district

    db.commit()
    db.refresh(user)

    if changes:
        log_action(db, admin.id, "user.update", "user", user.id, "; ".join(changes))

    return _to_admin_user_out(db, user)
