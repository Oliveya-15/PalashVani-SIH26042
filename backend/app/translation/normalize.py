"""
Stage 1 of the hybrid pipeline: normalization (see docs/ai-pipeline.md).

Goal: make "आप कैसे हैं?", "आप कैसे हैं", and "आप   कैसे हैं??" all resolve
to the same lookup key, without touching the meaning of the text. This is
plain, explainable, deterministic code -- no ML involved at this stage,
which is exactly why it's Stage 1: it's the cheapest, most reliable way to
catch the majority of real classroom phrasing variation before any
fuzzy/semantic matching is needed.
"""
import re
import unicodedata

# Devanagari + common punctuation that carries no lookup-relevant meaning
_PUNCTUATION_PATTERN = re.compile(r"[।॥?!.,;:\"'`‘’“”()\[\]{}]")
_WHITESPACE_PATTERN = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """Unicode-normalize, strip punctuation, collapse whitespace, casefold."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    text = _PUNCTUATION_PATTERN.sub("", text)
    text = _WHITESPACE_PATTERN.sub(" ", text)
    return text.strip().casefold()


def tokenize(text: str) -> list[str]:
    normalized = normalize_text(text)
    return [t for t in normalized.split(" ") if t]


def detect_script(text: str) -> str:
    """Very small heuristic script detector -- good enough to flag obviously
    unsupported input (e.g. someone pastes Bengali or pure Latin text into
    the Hindi box) without pulling in a full language-ID dependency."""
    if not text.strip():
        return "empty"
    devanagari = sum(1 for ch in text if "\u0900" <= ch <= "\u097F")
    latin = sum(1 for ch in text if ch.isascii() and ch.isalpha())
    total_letters = devanagari + latin
    if total_letters == 0:
        return "unknown"
    if devanagari / total_letters > 0.5:
        return "devanagari"
    if latin / total_letters > 0.5:
        return "latin"
    return "mixed"
