"""
Application configuration.

Everything here is read from environment variables (see .env.example at the
project root). Every setting has a safe, zero-cost default so the API starts
and works correctly even if no .env file is present at all -- this is a hard
project requirement (see docs/limitations.md and the README "Zero-cost"
section): no paid keys should ever be *required* to run the core app.
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
    # Fully optional. If the package or model weights are unavailable (e.g. no
    # internet on first run), the app automatically falls back to the
    # normalization + fuzzy-matching pipeline -- see app/translation/semantic.py.
    ENABLE_SEMANTIC_SEARCH: bool = True
    SEMANTIC_MODEL_NAME: str = "paraphrase-multilingual-MiniLM-L12-v2"

    # --- Optional external services (NEVER required for the core app) ---
    # Bhashini (National Language Translation Mission, Government of India) can
    # optionally be wired in as a live NMT/TTS fallback for phrases the local
    # corpus has no match for. It is disabled unless a key is explicitly set.
    BHASHINI_API_KEY: str = ""
    BHASHINI_ENABLED: bool = False

    # --- Rate limiting (very small, dependency-free token bucket) ---
    RATE_LIMIT_PER_MINUTE: int = 120

    # --- Misc ---
    MAX_UPLOAD_IMAGE_MB: int = 5


settings = Settings()
