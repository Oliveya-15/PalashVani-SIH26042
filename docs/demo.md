# Demo script (for SIH presentation / viva)

A suggested 4-5 minute walkthrough that touches every judged capability.

1. **Home (30s)** -- point out the eyebrow badge (SIH26042), the real
   PALASH network stats (1,041+ schools, 6 districts), and the live
   worked example in the hero. Say the one-sentence pitch: *"Hindi to
   Mundari, verified first, AI-assisted only when needed, never a silent
   guess."*

2. **Translate → Type (60s)** -- type `आप कैसे हैं?`. Point out:
   - the result appears with a **Verified / high confidence** badge
   - the method label ("Exact dataset match")
   - the transliteration and source citation underneath
   - click **Copy** and **Listen** to show both actually work

3. **Translate → an unseen phrase (30s)** -- type something not in the
   corpus (e.g. a full sentence). Show the honest **"No verified match
   found"** message. This is the single most important moment in the demo
   -- it's the proof the system doesn't fabricate answers.

4. **Translate → Voice (30s)** -- click Speak, say a Hindi phrase aloud,
   show the transcript populate the input box automatically.

5. **Translate → Scan (45s)** -- upload a photo of printed Hindi text
   (a textbook page, or even a phone screenshot of Hindi text), show
   Tesseract.js extract it client-side, then translate the extracted text.

6. **Dictionary / Search (30s)** -- search "गाय" or filter by category
   "animal", point out pagination and the verified/unverified badges.

7. **Curriculum (30s)** -- open Grade 1 → Language → "Introductions &
   Greetings", show the same corpus entries organised for classroom use,
   with the note explaining this is a demonstration structure, not the
   official JCERT sequence.

8. **Flashcards (20s)** -- flip a card or two.

9. **Dataset & Offline (30s)** -- show the real per-language counts (not
   fabricated), download a category, then (if convenient) show DevTools
   Network tab set to "Offline" and repeat a search to prove the cached
   category still works.

10. **About & Confidence (20s)** -- close on the Confidence Flag
    explanation and the honestly-stated limitations -- reviewers respond
    well to a team that states its own boundaries clearly.

## If asked "is this connected to a real AI model?"

Yes -- open `/docs` (FastAPI's Swagger UI) on the backend, show
`GET /api/health`'s `semantic_search_available: true`, then explain the
`sentence-transformers` / MiniLM semantic stage from `docs/ai-pipeline.md`
in one or two sentences and point out the `ai_assisted` flag on any
result it produced.

## If the internet is down at demo time

Everything above still works **except**: the semantic layer's first-ever
model download (if it hasn't already happened on the demo machine before),
Bhashini (already disabled by default), and Google Fonts (falls back to
system fonts). The core exact/fuzzy pipeline, OCR, voice, and offline
content packs all run with zero network access -- this is worth saying out
loud, since it's a direct answer to the PPT's own "connectivity gaps in
remote schools" risk row.
