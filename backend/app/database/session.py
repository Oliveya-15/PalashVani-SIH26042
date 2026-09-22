"""
SQLAlchemy engine + session factory.

Why SQLAlchemy Core/ORM instead of raw sqlite3 (see docs/database.md
"Why this approach"): it gives us a single code path that works against
SQLite today and PostgreSQL later with only DATABASE_URL changing -- the
PPT and project brief both call for that migration path, and hand-written
SQL string would have to be rewritten per-dialect.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # allow the SQLite connection to be used across the async request/thread
    # pool FastAPI uses internally
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, future=True)


if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        # Enforce foreign key constraints -- SQLite ignores them by default.
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yields a request-scoped DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
