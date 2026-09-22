"""
Shared pytest fixtures.

Tests run against an isolated in-memory SQLite database (never the real
data/processed/palashvani.db file), seeded with a small, deterministic set
of languages + translation entries so test results never depend on
whatever the developer has imported locally.
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
