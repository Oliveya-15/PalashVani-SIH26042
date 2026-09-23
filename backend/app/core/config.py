"""
MODIFIED FILE -- this is your existing backend/app/core/config.py with
ONLY the "Auth / JWT" section added at the bottom of the Settings class.
Every line above that section is identical to your current file. If your
live file has diverged from the version originally delivered, just add
the new block yourself instead of replacing the whole file -- see
SETUP_INSTRUCTIONS.md for the exact lines to add.
"""
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> project root
BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), extra="ignore")

    # --- General ---
    APP_NAME: str = "PalashVani API"
    APP_ENV: str = "development"  # development | production
    API_V1_PREFIX: str = "/api"

    # --- Database ---
    # SQLite by default: zero setup, file-based, perfect for a local/offline-first
    # classroom prototype. DATABASE_URL can be swapped for a PostgreSQL URL
    # (postgresql+psycopg2://user:pass@host:5432/db) without changing any
    # application code -- see docs/database.md.
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'processed' / 'palashvani.db'}"

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # --- Translation / AI pipeline thresholds (0-1 similarity scores) ---
    FUZZY_HIGH_THRESHOLD: float = 0.90   # >= this -> treated as a confident dataset match
    FUZZY_LOW_THRESHOLD: float = 0.72    # >= this -> shown as a fuzzy dataset match
    SEMANTIC_THRESHOLD: float = 0.55     # >= this -> shown as AI-assisted / semantic match
    SEARCH_DEFAULT_PAGE_SIZE: int = 20
    SEARCH_MAX_PAGE_SIZE: int = 100

    # --- Optional semantic layer (sentence-transformers) ---
    ENABLE_SEMANTIC_SEARCH: bool = True
    SEMANTIC_MODEL_NAME: str = "paraphrase-multilingual-MiniLM-L12-v2"

    # --- Optional external services (NEVER required for the core app) ---
    BHASHINI_API_KEY: str = ""
    BHASHINI_ENABLED: bool = False

    # --- Rate limiting (very small, dependency-free token bucket) ---
    RATE_LIMIT_PER_MINUTE: int = 120

    # --- Misc ---
    MAX_UPLOAD_IMAGE_MB: int = 5

    # ================================================================
    # NEW -- Auth / JWT (added for the login/register feature)
    # ================================================================
    # IMPORTANT: the default below is fine for local development only.
    # Set a real, random JWT_SECRET_KEY as an environment variable on
    # Render (or wherever the backend is deployed) -- anyone who has this
    # value can forge valid login tokens. Generate one with:
    #   python -c "import secrets; print(secrets.token_urlsafe(48))"
    JWT_SECRET_KEY: str = "dev-only-insecure-secret-CHANGE-ME-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days


settings = Settings()
