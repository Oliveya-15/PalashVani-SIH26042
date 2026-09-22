"""
Centralised logging configuration.

Rationale (see docs/architecture.md "Why this approach"): technical errors
must be logged server-side but never exposed to the end user as a stack
trace (see app/main.py exception handlers). A single named logger keeps
this consistent across every module instead of ad-hoc print() calls.
"""
import logging
import sys

from app.core.config import settings

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"


def configure_logging() -> None:
    level = logging.DEBUG if settings.APP_ENV == "development" else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(LOG_FORMAT))

    root = logging.getLogger("palashvani")
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)
    root.propagate = False


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"palashvani.{name}")
