"""Shared FastAPI dependencies."""
from app.database.session import get_db  # re-exported for a single import path across routers

__all__ = ["get_db"]
