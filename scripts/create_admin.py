#!/usr/bin/env python3
"""
NEW FILE -- creates an admin account directly in the database.

Admin accounts are intentionally NOT available through the public
POST /api/auth/register endpoint (see app/models/user.py's docstring) --
this script is the deliberate, government-system-appropriate substitute:
run locally, by whoever controls the database, never exposed over HTTP.

Usage (from the project root, backend venv active):
    python scripts/create_admin.py --name "Dept Admin" --email admin@palashvani.gov.in --password "choose-a-strong-one"
"""
import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.core.security import hash_password  # noqa: E402
from app.database.init_db import init_db  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402


def create_admin(name: str, email: str, password: str) -> None:
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            print(f"A user with email '{email}' already exists (role={existing.role}). Nothing to do.")
            return

        admin = User(
            full_name=name.strip(),
            email=email.lower().strip(),
            hashed_password=hash_password(password),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin account created: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    if len(args.password) < 8:
        print("ERROR: password must be at least 8 characters.")
        sys.exit(1)

    create_admin(args.name, args.email, args.password)
