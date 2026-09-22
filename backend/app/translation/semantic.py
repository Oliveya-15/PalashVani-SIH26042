"""
Stage 5 of the hybrid pipeline (optional): semantic matching.

This is "the genuine AI/ML core" referenced in the SIH pitch -- a real
sentence-embedding model (multilingual MiniLM, via `sentence-transformers`)
that can recognise that "आप कैसे हैं?" and "आपकी तबियत कैसी है?" are asking
almost the same thing, even though no exact or fuzzy string match exists.
It runs entirely on CPU, needs no GPU and no paid API key.

Why it is optional rather than mandatory (see docs/ai-pipeline.md and the
project's zero-cost/offline requirement): the *model weights* (~470 MB)
are downloaded once from Hugging Face the first time this class is used,
which needs internet. On a machine with no internet, or if the pip package
simply isn't installed, `SemanticMatcher.is_available` becomes False and
`TranslationService` (app/services/translation_service.py) transparently
skips straight from fuzzy matching to an honest "no verified match" --
the app never crashes and never pretends the semantic layer ran.

A tiny in-process cache re-embeds the corpus only when it actually changes
(tracked with a cheap content hash), so repeated requests are fast.
"""
from __future__ import annotations

import hashlib
import threading
from typing import TYPE_CHECKING

from app.core.config import settings
from app.core.logging_config import get_logger

if TYPE_CHECKING:
    import numpy as np

logger = get_logger("semantic")


class SemanticMatcher:
    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.SEMANTIC_MODEL_NAME
        self._model = None
        self._lock = threading.Lock()
        self._corpus_hash: str | None = None
        self._corpus_ids: list[int] = []
        self._corpus_texts: list[str] = []
        self._embeddings: "np.ndarray | None" = None
        self._load_attempted = False
        self._load_error: str | None = None

    # -- lazy model loading -------------------------------------------------
    def _ensure_model(self) -> bool:
        if self._model is not None:
            return True
        if self._load_attempted:
            return False
        with self._lock:
            if self._model is not None:
                return True
            self._load_attempted = True
            if not settings.ENABLE_SEMANTIC_SEARCH:
                self._load_error = "disabled via ENABLE_SEMANTIC_SEARCH=false"
                return False
            try:
                from sentence_transformers import SentenceTransformer  # local import: optional dependency

                self._model = SentenceTransformer(self.model_name)
                logger.info("Semantic model '%s' loaded.", self.model_name)
                return True
            except Exception as exc:  # broad on purpose: any failure -> graceful fallback
                self._load_error = str(exc)
                logger.warning(
                    "Semantic search unavailable (%s). Falling back to fuzzy/dataset matching only.",
                    self._load_error,
                )
                return False

    @property
    def is_available(self) -> bool:
        return self._ensure_model()

    @property
    def unavailable_reason(self) -> str | None:
        return self._load_error

    # -- corpus embedding cache ----------------------------------------------
    def _corpus_signature(self, ids: list[int], texts: list[str]) -> str:
        h = hashlib.sha256()
        for i, t in zip(ids, texts):
            h.update(f"{i}:{t}".encode("utf-8"))
        return h.hexdigest()

    def _refresh_corpus(self, ids: list[int], texts: list[str]) -> None:
        signature = self._corpus_signature(ids, texts)
        if signature == self._corpus_hash:
            return
        model = self._model
        self._embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        self._corpus_ids = ids
        self._corpus_texts = texts
        self._corpus_hash = signature
        logger.info("Re-embedded semantic corpus (%d entries).", len(texts))

    # -- public API -----------------------------------------------------------
    def top_matches(self, query: str, ids: list[int], texts: list[str], top_k: int = 3):
        """Returns a list of (entry_id, text, cosine_similarity) sorted desc.
        Returns [] if the semantic layer is unavailable or the corpus is empty."""
        if not texts or not self._ensure_model():
            return []
        import numpy as np

        self._refresh_corpus(ids, texts)
        query_vec = self._model.encode([query], convert_to_numpy=True, normalize_embeddings=True)[0]
        scores = self._embeddings @ query_vec  # cosine similarity (vectors are pre-normalized)
        top_idx = np.argsort(-scores)[:top_k]
        return [(self._corpus_ids[i], self._corpus_texts[i], float(scores[i])) for i in top_idx]


# Process-wide singleton so the model (and its embedding cache) is loaded at
# most once per running server, not once per request.
semantic_matcher = SemanticMatcher()
