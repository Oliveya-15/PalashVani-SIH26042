"""
Stages 2-4 of the hybrid pipeline: exact / normalized / fuzzy matching
(see docs/ai-pipeline.md). This module never requires internet access or
a model download -- it is the guaranteed-available baseline the app falls
back to even if the optional semantic layer (app/translation/semantic.py)
can't load.

Fuzzy matching prefers `rapidfuzz` (fast, C-accelerated, still 100% free
and open-source) but transparently falls back to Python's built-in
`difflib` if rapidfuzz isn't installed, so the app never hard-crashes for
lack of an optional dependency -- see the try/except below.
"""
from dataclasses import dataclass
from difflib import SequenceMatcher

from app.translation.normalize import normalize_text

try:
    from rapidfuzz import fuzz as _rapidfuzz_fuzz
    _HAS_RAPIDFUZZ = True
except ImportError:  # pragma: no cover - exercised when rapidfuzz isn't installed
    _HAS_RAPIDFUZZ = False


@dataclass
class MatchCandidate:
    entry_id: int
    source_text: str
    target_text: str
    score: float  # 0.0 - 1.0


def similarity_ratio(a: str, b: str) -> float:
    """Return a 0-1 similarity score between two already-normalized strings."""
    if not a or not b:
        return 0.0
    if _HAS_RAPIDFUZZ:
        return _rapidfuzz_fuzz.ratio(a, b) / 100.0
    return SequenceMatcher(None, a, b).ratio()


def find_exact(normalized_query: str, entries: list) -> "MatchCandidate | None":
    """`entries` is a list of ORM TranslationEntry-like objects with
    .id/.source_text/.target_text/.normalized_source attributes."""
    for entry in entries:
        if entry.normalized_source == normalized_query:
            return MatchCandidate(entry.id, entry.source_text, entry.target_text, 1.0)
    return None


def find_best_fuzzy(normalized_query: str, entries: list, top_k: int = 3) -> list[MatchCandidate]:
    scored = [
        MatchCandidate(e.id, e.source_text, e.target_text, similarity_ratio(normalized_query, e.normalized_source))
        for e in entries
    ]
    scored.sort(key=lambda c: c.score, reverse=True)
    return scored[:top_k]


def engine_name() -> str:
    return "rapidfuzz" if _HAS_RAPIDFUZZ else "difflib (stdlib fallback)"
