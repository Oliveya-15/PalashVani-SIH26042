"""
TranslationService orchestrates the full hybrid pipeline described in
docs/ai-pipeline.md and walks through every stage in order, stopping as
soon as one produces a confident-enough result:

    1. Normalize the input                      (app/translation/normalize.py)
    2. Exact match against the corpus            (app/translation/matcher.py)
    3. Fuzzy match against the corpus             (app/translation/matcher.py)
    4. Semantic match against the corpus          (app/translation/semantic.py, optional)
    5. Optional external fallback (Bhashini)      (app/ai/bhashini_stub.py, disabled by default)
    6. Honest "no verified match" response

Every result is labelled with exactly how it was produced -- this
"explainability" is a first-class product requirement (the PPT calls it
the "Confidence Flag"), not an afterthought bolted on for the demo.
"""
from sqlalchemy.orm import Session

from app.ai.bhashini_stub import bhashini_fallback
from app.core.config import settings
from app.core.logging_config import get_logger
from app.repositories import translation_repo
from app.translation.matcher import find_best_fuzzy, find_exact
from app.translation.normalize import detect_script, normalize_text
from app.translation.semantic import semantic_matcher
from app.schemas.schemas import AlternativeSuggestion, TranslateResponse

logger = get_logger("translation_service")


def _confidence_label(confidence: float, method: str) -> str:
    if method == "none":
        return "none"
    if confidence >= settings.FUZZY_HIGH_THRESHOLD:
        return "high"
    if confidence >= settings.SEMANTIC_THRESHOLD:
        return "medium"
    return "low"


def translate(db: Session, text: str, source_code: str, target_code: str) -> TranslateResponse:
    normalized = normalize_text(text)
    script = detect_script(text)

    source_lang = translation_repo.get_language_by_code(db, source_code)
    target_lang = translation_repo.get_language_by_code(db, target_code)

    if not source_lang or not target_lang:
        return TranslateResponse(
            input_text=text,
            normalized_input=normalized,
            result_text=None,
            method="none",
            confidence=0.0,
            confidence_label="none",
            verified=False,
            ai_assisted=False,
            message=f"Unknown language pair '{source_code}' -> '{target_code}'.",
            alternatives=[],
        )

    if not normalized:
        return TranslateResponse(
            input_text=text,
            normalized_input=normalized,
            result_text=None,
            method="none",
            confidence=0.0,
            confidence_label="none",
            verified=False,
            ai_assisted=False,
            message="Please enter some text to translate.",
            alternatives=[],
        )

    entries = translation_repo.get_entries_for_direction(db, source_lang.id, target_lang.id)

    if not entries:
        message = (
            f"No dataset is loaded yet for {source_lang.name_en} -> {target_lang.name_en}. "
            "Import a corpus for this language pair (see data/README.md) to enable translation."
        )
        return _finalize(db, text, normalized, None, "none", 0.0, source_code, target_code, None, message, [])

    # --- Stage 2: exact / normalized match ---------------------------------
    exact = find_exact(normalized, entries)
    if exact:
        entry = next(e for e in entries if e.id == exact.entry_id)
        message = "Exact match found in the verified dataset."
        return _finalize(
            db, text, normalized, entry.target_text, "exact", 1.0,
            source_code, target_code, entry, message, [],
        )

    # --- Stage 3: fuzzy match -----------------------------------------------
    fuzzy_candidates = find_best_fuzzy(normalized, entries, top_k=5)
    best_fuzzy = fuzzy_candidates[0] if fuzzy_candidates else None

    if best_fuzzy and best_fuzzy.score >= settings.FUZZY_HIGH_THRESHOLD:
        entry = next(e for e in entries if e.id == best_fuzzy.entry_id)
        message = "Close match found in the verified dataset (minor spelling/spacing difference)."
        alts = _alt_suggestions(fuzzy_candidates[1:4])
        return _finalize(
            db, text, normalized, entry.target_text, "fuzzy", best_fuzzy.score,
            source_code, target_code, entry, message, alts,
        )

    if best_fuzzy and best_fuzzy.score >= settings.FUZZY_LOW_THRESHOLD:
        entry = next(e for e in entries if e.id == best_fuzzy.entry_id)
        message = "Exact dataset match not found. Showing the closest dataset entry (fuzzy match) instead."
        alts = _alt_suggestions(fuzzy_candidates[1:4])
        return _finalize(
            db, text, normalized, entry.target_text, "fuzzy", best_fuzzy.score,
            source_code, target_code, entry, message, alts,
        )

    # --- Stage 4: semantic match (optional) ---------------------------------
    ids = [e.id for e in entries]
    texts = [e.normalized_source for e in entries]
    semantic_hits = semantic_matcher.top_matches(normalized, ids, texts, top_k=3)

    if semantic_hits and semantic_hits[0][2] >= settings.SEMANTIC_THRESHOLD:
        best_id, _best_text, best_score = semantic_hits[0]
        entry = next(e for e in entries if e.id == best_id)
        message = (
            "Exact dataset match not found. This result is AI-assisted (semantic similarity) "
            "and has not been human-verified -- please confirm with a native speaker before "
            "classroom use."
        )
        alts = [
            AlternativeSuggestion(text=next(e for e in entries if e.id == eid).target_text, similarity=round(score, 3))
            for eid, _t, score in semantic_hits[1:3]
        ]
        return _finalize(
            db, text, normalized, entry.target_text, "semantic", best_score,
            source_code, target_code, entry, message, alts, ai_assisted=True,
        )

    # --- Stage 5: optional external fallback (disabled unless configured) --
    external = bhashini_fallback(text, source_code, target_code)
    if external is not None:
        return _finalize(
            db, text, normalized, external.text, "external_bhashini", external.confidence,
            source_code, target_code, None, external.message, [], ai_assisted=True,
        )

    # --- Stage 6: honest "no match" -----------------------------------------
    nearest_alts = _alt_suggestions(fuzzy_candidates[:3]) if fuzzy_candidates else []
    message = (
        "No verified match found in the current dataset for this phrase. "
        "We do not guess -- please try rephrasing, browse the Dictionary, "
        "or use Feedback to suggest this phrase for the corpus."
    )
    return _finalize(
        db, text, normalized, None, "none", 0.0,
        source_code, target_code, None, message, nearest_alts,
    )


def _alt_suggestions(candidates) -> list[AlternativeSuggestion]:
    return [AlternativeSuggestion(text=c.target_text, similarity=round(c.score, 3)) for c in candidates if c.score > 0]


def _finalize(
    db, input_text, normalized, result_text, method, confidence,
    source_code, target_code, entry, message, alternatives, ai_assisted: bool = False,
) -> TranslateResponse:
    history = translation_repo.record_history(
        db, input_text, result_text, source_code, target_code, method, confidence,
        entry.id if entry else None,
    )
    return TranslateResponse(
        input_text=input_text,
        normalized_input=normalized,
        result_text=result_text,
        method=method,
        confidence=round(confidence, 3),
        confidence_label=_confidence_label(confidence, method),
        verified=bool(entry.verified) if entry and method in ("exact", "normalized", "fuzzy") else False,
        ai_assisted=ai_assisted,
        message=message,
        category=entry.category if entry else None,
        transliteration=entry.transliteration if entry else None,
        source_citation=entry.source_citation if entry else None,
        alternatives=alternatives,
        history_id=history.id,
    )
