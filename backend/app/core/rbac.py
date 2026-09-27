"""
NEW FILE -- role-based access control, built on top of the existing
`get_current_user` dependency from app/services/auth_service.py (from the
previous login/register update -- unchanged).

Usage in a route:

    @router.get("/admin/users")
    def list_users(admin: User = Depends(require_admin)):
        ...

    @router.get("/dataset/stats")
    def dataset_stats(user: User = Depends(require_teacher_or_admin)):
        ...

See docs/admin-notes.md "Why login is now required everywhere" and "What
teachers can do that students can't" for the reasoning behind exactly
which routes use which of these.
"""
from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.services.auth_service import get_current_user


def require_roles(*allowed_roles: str):
    """Returns a FastAPI dependency that only lets the given roles through."""

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"This action requires one of these roles: {', '.join(allowed_roles)}.",
            )
        return current_user

    return dependency


# Any authenticated user (teacher, student, or admin) -- this is just
# `get_current_user` under a clearer name for use on the app's core
# learning features, now that login is required to reach them at all.
require_authenticated = get_current_user

# Teacher or admin only -- used for the Dataset & Offline stats endpoint,
# which is a lesson-preparation/content-management view, not a student
# learning screen. See docs/admin-notes.md for the reasoning.
require_teacher_or_admin = require_roles("teacher", "admin")

# Admin only -- every route under /api/admin/*.
require_admin = require_roles("admin")
