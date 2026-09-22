# AI / NLP Pipeline

This is the single most important document for the SIH viva -- it explains
exactly what is, and isn't, "real AI" in this prototype, and why.

## The six stages

| # | Stage | File | Requires internet / a model? | Produces |
|---|---|---|---|---|
| 1 | Normalize | `app/translation/normalize.py` | No | A canonical lookup key (Unicode NFC, punctuation stripped, whitespace collapsed) |
| 2 | Exact / normalized match | `app/translation/matcher.py` | No | `method="exact"`, confidence `1.0` |
| 3 | Fuzzy match | `app/translation/matcher.py` | No (rapidfuzz if installed, else Python's stdlib `difflib`) | `method="fuzzy"`, confidence = similarity ratio |
| 4 | Semantic match | `app/translation/semantic.py` | Model download on first use only (~470 MB, then fully offline) | `method="semantic"`, confidence = cosine similarity, flagged `ai_assisted=true` |
| 5 | External fallback (optional, off by default) | `app/ai/bhashini_stub.py` | Yes, if ever enabled | `method="external_bhashini"` |
| 6 | Honest "no match" | `app/services/translation_service.py` | No | `method="none"`, no result text, no guess |

The pipeline **stops at the first stage that clears its confidence bar**
(see thresholds below) -- it never runs a later, more expensive/less
reliable stage if an earlier, more trustworthy one already answered.

## Why this counts as "real AI," and where the line is drawn

Stage 4 is the part that is genuinely machine learning: a pretrained
multilingual sentence-embedding transformer
(`paraphrase-multilingual-MiniLM-L12-v2`, via the open-source
`sentence-transformers` library) encodes both the query and every corpus
entry into vectors, then ranks corpus entries by cosine similarity. This is
what lets the system recognise that "आपका नाम क्या है?" and "तुम्हारा नाम
क्या है?" are asking the same thing, even though they don't share enough
characters to fuzzy-match. It runs entirely on CPU, needs no GPU, and never
sends data anywhere over the network at request time.

Stages 1-3 are deliberately **not** machine learning -- they are plain,
auditable string processing. This is a design choice, not a limitation: a
teacher (or examiner) can read `normalize.py` top to bottom and know
exactly what it will do to any input, which is precisely the trust a
never-guess tool needs for the 95% of classroom phrases that are exact or
near-exact corpus matches.

## Confidence thresholds (configurable, `backend/.env`)

| Setting | Default | Effect |
|---|---|---|
| `FUZZY_HIGH_THRESHOLD` | 0.90 | Fuzzy matches at or above this are labelled **high** confidence |
| `FUZZY_LOW_THRESHOLD` | 0.72 | Fuzzy matches at or above this (but below high) are shown, labelled, but as a deliberately weaker claim |
| `SEMANTIC_THRESHOLD` | 0.55 | Minimum cosine similarity for a semantic hit to be shown at all |

These were chosen empirically against the seed corpus and are meant to be
tuned once a larger corpus is imported -- see `docs/limitations.md`.

## What "AI-assisted" means on screen

Every `TranslateResponse` carries three independent signals the frontend
uses to build its confidence badge (`ConfidenceBadge.tsx`):

- **`verified`** -- true only for exact/fuzzy hits against the curated,
  human-checked corpus.
- **`ai_assisted`** -- true only for stage 4/5 results. The UI always
  pairs this with a visible "please verify" note
  (`translate.aiAssistedLabel`), matching the PPT's own "Confidence Flag"
  concept almost verbatim.
- **`confidence` / `confidence_label`** -- the numeric score and a
  human-readable high/medium/low/none bucket, shown regardless of
  `verified`/`ai_assisted` so a teacher always sees *some* number, not
  just a colour.

## Graceful degradation (why the app never crashes without the AI package)

`SemanticMatcher._ensure_model()` (`app/translation/semantic.py`) wraps the
`sentence-transformers` import and model load in a broad `try/except`. If
the package isn't installed, or the model can't be downloaded (no
internet), `is_available` becomes `False` once, is cached, and every
subsequent request silently skips straight from fuzzy matching to the
honest "no match" stage. `GET /api/health` exposes
`semantic_search_available` precisely so this is observable rather than a
silent surprise.

## Text-to-speech: an honest limitation, not a fake feature

No mainstream browser ships a dedicated Mundari voice. Rather than fake an
audio layer, `useSpeechSynthesis.ts` picks the closest available
Devanagari-capable voice (typically Hindi) and the UI explicitly labels the
result as an approximation (`translate.ttsApproximateNote`) -- this is the
same honesty principle applied to audio that the Confidence Flag applies to
text.
