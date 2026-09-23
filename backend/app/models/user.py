"""
NEW FILE -- the User model.

Kept in its own file (app/models/user.py) rather than added into the
existing app/models/models.py so this update touches zero lines of your
existing model file. It shares the same declarative Base (imported from
app/database/session.py, unchanged), so Base.metadata.create_all() picks
it up automatically -- see the one-line addition needed in
app/database/init_db.py, documented in SETUP_INSTRUCTIONS.md.

Roles (see docs/auth-notes.md for the reasoning): the SIH26042 problem
statement is a teacher-facing classroom tool with government (Dept. of
Higher & Technical Education, Jharkhand) ownership, so three roles are
modelled --

  teacher  -- the primary user (default on registration)
  student  -- included since the brief named students as a possible user;
              currently has identical permissions to "teacher" since no
              student-specific screen exists yet (see Future Scope)
  admin    -- reserved for departmental/government oversight accounts.
              NOT self-registerable via the public API (enforced in
              app/services/auth_service.py) -- create one with
              scripts/create_admin.py instead, matching how a real
              government system would provision administrative access.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="teacher")  # teacher | student | admin
    school_name: Mapped[str] = mapped_column(String(200), default="")
    district: Mapped[str] = mapped_column(String(100), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
