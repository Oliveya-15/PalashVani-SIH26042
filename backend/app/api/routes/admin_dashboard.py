"""
NEW FILE -- admin-only read views: dashboard overview, submitted feedback,
and the audit log of every admin action. Nothing here writes to the
database (except dashboard_stats, which only reads), so nothing is
audit-logged in this file.

    GET /api/admin/dashboard/stats     real, computed counts -- never fabricated
    GET /api/admin/dashboard/feedback  every feedback submission, newest first
    GET /api/admin/dashboard/audit-log every admin action, newest first
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import require_admin
from app.models.audit_log import AuditLog
from app.models.user import User
from app.repositories import admin_repo
from app.schemas.admin_schemas import (
    AdminFeedbackListResponse,
    AdminFeedbackOut,
    AuditLogListResponse,
    AuditLogOut,
    DashboardStatsResponse,
)

router = APIRouter(prefix="/admin/dashboard", tags=["admin"])


@router.get("/stats", response_model=DashboardStatsResponse)
def stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> DashboardStatsResponse:
    return DashboardStatsResponse(**admin_repo.dashboard_stats(db))


@router.get("/feedback", response_model=AdminFeedbackListResponse)
def feedback(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminFeedbackListResponse:
    items, users_by_id, total = admin_repo.list_feedback(db, page, page_size)
    out = []
    for f in items:
        user = users_by_id.get(f.user_id) if f.user_id else None
        out.append(AdminFeedbackOut(
            id=f.id, message=f.message, rating=f.rating, page=f.page,
            user_full_name=user.full_name if user else None,
            user_email=user.email if user else None,
            created_at=f.created_at,
        ))
    return AdminFeedbackListResponse(total=total, page=page, page_size=page_size, items=out)


@router.get("/audit-log", response_model=AuditLogListResponse)
def audit_log(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AuditLogListResponse:
    q = db.query(AuditLog)
    total = q.count()
    rows = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    admin_ids = {r.admin_user_id for r in rows}
    names = {}
    if admin_ids:
        for u in db.query(User).filter(User.id.in_(admin_ids)).all():
            names[u.id] = u.full_name

    items = [
        AuditLogOut(
            id=r.id, admin_user_id=r.admin_user_id, admin_name=names.get(r.admin_user_id),
            action=r.action, target_type=r.target_type, target_id=r.target_id,
            details=r.details, created_at=r.created_at,
        )
        for r in rows
    ]
    return AuditLogListResponse(total=total, page=page, page_size=page_size, items=items)
