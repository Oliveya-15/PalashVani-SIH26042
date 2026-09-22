"""
Optional external fallback: Bhashini (India's National Language Translation
Mission, https://bhashini.gov.in) live NMT/TTS, exactly as named in the SIH
PPT's own architecture slide ("Bhashini fills the gap -- live NMT/TTS only
when no match exists").

This is intentionally a STUB, not a live integration, for three honest
reasons documented in docs/limitations.md:
  1. The zero-cost/offline requirement means the CORE app must work with
     zero API keys and zero internet -- Bhashini needs both.
  2. Bhashini's pipeline-config API coverage for Mundari is, per the PPT's
     own feasibility slide, *unconfirmed* -- shipping a live call to an
     unverified endpoint would risk silently producing wrong output, which
     violates the project's "never guess" rule.
  3. Committing a real API key in a student project is a security mistake
     the project brief explicitly warns against.

`bhashini_fallback()` returns None (i.e. "skip this stage") unless
BHASHINI_ENABLED=true and BHASHINI_API_KEY is set in the environment. If a
future team wires up the real call, this is the single place to do it --
the calling code in translation_service.py already treats a non-None
result as an AI-assisted, unverified translation.
"""
from dataclasses import dataclass

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("bhashini_stub")


@dataclass
class ExternalResult:
    text: str
    confidence: float
    message: str


def bhashini_fallback(text: str, source_code: str, target_code: str) -> "ExternalResult | None":
    if not settings.BHASHINI_ENABLED or not settings.BHASHINI_API_KEY:
        return None

    # A real integration would call the Bhashini pipeline-config + compute
    # APIs here (see https://bhashini.gov.in for API docs) and map the
    # response into an ExternalResult. Left unimplemented on purpose --
    # see the module docstring for why this is a deliberate scope boundary
    # for the academic prototype rather than an oversight.
    logger.warning("BHASHINI_ENABLED is true but no live integration is implemented; skipping.")
    return None
