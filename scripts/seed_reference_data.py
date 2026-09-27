#!/usr/bin/env python3
"""
NEW FILE -- run this once after `alembic upgrade head` on a fresh
database (or whenever you add a new language/grade to the reference
lists in app/database/init_db.py). Replaces the old implicit
"seed on every app boot" behavior -- see that file's own docstring and
docs/admin-notes.md for why.

Usage (from the project root, backend venv active):
    alembic -c backend/alembic.ini upgrade head
    python scripts/seed_reference_data.py
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.database.init_db import seed_reference_data  # noqa: E402

if __name__ == "__main__":
    seed_reference_data()
