"""
MODIFIED FILE -- your existing backend/tests/conftest.py. Changes, marked
"NEW" below: imports the User and AuditLog models (so their tables exist
in the isolated test database -- same reasoning as
backend/app/database/init_db.py importing them), and adds two new
fixtures, `auth_headers` and `admin_headers`, since most existing routes
now require a logged-in user. The original `db_session` and `client`
fixtures -- including the seeded languages/entries -- are completely
unchanged.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("APP_ENV", "test")  # keeps app.main's startup hook from touching the real DB file

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database.session import Base, get_db
from app.main import app
from app.models.models import Language, TranslationEntry
from app.models.user import User  # NEW -- registers the `users` table for the test DB
from app.models.audit_log import AuditLog  # NEW -- registers the `audit_log` table for the test DB
from app.translation.normalize import normalize_text

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    hi = Language(code="hi", name_en="Hindi", name_hi="हिन्दी", script="Devanagari", is_tribal=False, status="active")
    mundari = Language(code="mundari", name_en="Mundari", name_hi="मुंडारी", script="Devanagari", is_tribal=True, status="active")
    session.add_all([hi, mundari])
    session.flush()

    seed_pairs = [
        ("नमस्ते", "जोहार", "greeting", "johaar", True),
        ("एक", "मियद", "number", "miyad", True),
        ("दो", "बरिया", "number", "bariya", True),
        ("आप कैसे हैं?", "आम चिलेका मेना मा?", "greeting", "aam chileka mena maa?", True),
    ]
    for source, target, category, translit, verified in seed_pairs:
        session.add(TranslationEntry(
            source_language_id=hi.id,
            target_language_id=mundari.id,
            source_text=source,
            target_text=target,
            normalized_source=normalize_text(source),
            category=category,
            transliteration=translit,
            source_citation="test fixture",
            verified=verified,
        ))
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------- NEW --
@pytest.fixture()
def auth_headers(client):
    """Registers a teacher account through the real endpoint and returns
    ready-to-use Authorization headers -- for any test on a route that
    now requires login."""
    response = client.post("/api/auth/register", json={
        "full_name": "Test Teacher",
        "email": "test.teacher@example.com",
        "password": "a-strong-password",
        "role": "teacher",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_headers(client, db_session):
    """Creates an admin account directly in the test database (bypassing
    the public register endpoint, which correctly refuses role='admin' --
    see app/models/user.py) and returns ready-to-use Authorization headers."""
    from app.core.security import create_access_token, hash_password

    admin = User(
        full_name="Test Admin",
        email="test.admin@example.com",
        hashed_password=hash_password("a-strong-password"),
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    token = create_access_token(admin.id, admin.role)
    return {"Authorization": f"Bearer {token}"}
