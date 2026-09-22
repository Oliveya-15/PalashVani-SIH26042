"""
FastAPI application entrypoint.

Run with:  uvicorn app.main:app --reload --port 8000   (from the backend/ directory)
Docs at:   http://localhost:8000/docs   (Swagger UI, generated automatically by FastAPI)
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import curriculum, dataset, feedback, flashcards, health, languages, translations
from app.core.config import settings
from app.core.logging_config import configure_logging, get_logger
from app.core.rate_limit import RateLimitMiddleware
from app.database.init_db import init_db

configure_logging()
logger = get_logger("main")

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "REST API for PalashVani -- an offline-first Hindi -> Mundari translation and "
        "mother-tongue FLN classroom-support tool built for SIH Problem Statement 26042."
    ),
    version="1.0.0",
)

# --- CORS ---------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate limiting --------------------------------------------------------
app.add_middleware(RateLimitMiddleware)


# --- Safe error handling: never leak stack traces to the client ----------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Invalid request.", "errors": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred. Please try again."})


# --- Startup: ensure tables + reference data exist ------------------------
@app.on_event("startup")
def on_startup() -> None:
    if settings.APP_ENV == "test":
        # Tests provide their own isolated in-memory database via dependency
        # overrides (see backend/tests/conftest.py) and must never touch the
        # real data/processed/palashvani.db file.
        logger.info("PalashVani API started in TEST mode (skipping real DB init).")
        return
    init_db()
    logger.info("PalashVani API started (env=%s).", settings.APP_ENV)


# --- Routers ---------------------------------------------------------------
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(languages.router, prefix=settings.API_V1_PREFIX)
app.include_router(translations.router, prefix=settings.API_V1_PREFIX)
app.include_router(dataset.router, prefix=settings.API_V1_PREFIX)
app.include_router(curriculum.router, prefix=settings.API_V1_PREFIX)
app.include_router(flashcards.router, prefix=settings.API_V1_PREFIX)
app.include_router(feedback.router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["health"])
def root():
    return {
        "name": settings.APP_NAME,
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX,
    }
