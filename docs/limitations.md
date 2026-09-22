# Limitations

Stated plainly and up front, because the project's own design principle
("never guess, never hide the gap") applies to this document as much as to
a translation result.

## Dataset

- The shipped corpus is **57 hand-sourced pairs**, not the ~30,000+ pair
  Hindi-Mundari corpus referenced in the original project brief, and not
  the 97,826-pair combined research corpus referenced in the SIH pitch
  deck. No dataset file was supplied alongside the PPT and logo for this
  build; see `data/README.md` for exactly where every row came from and
  how to import a larger, licensed corpus later.
- Coverage is limited to a handful of everyday categories (greetings,
  numbers, colours, animals, food, fruit, time-of-day). Anything outside
  those categories will usually and correctly return "no verified match."
- Ho and Santali are represented in the `languages` table (`status:
  "planned"`) but have **no data yet** -- the architecture supports them
  (see `docs/architecture.md`), but the UI will not translate into them
  until a corpus is imported for each.
- The curriculum shown on the "Browse by Chapter" screen is a
  **demonstration structure** built from the same 57 verified rows, not
  the official JCERT Class 1-5 textbook sequence -- that requires the
  formal JCERT partnership the PPT itself lists as a later phase.

## Translation quality

- Confidence thresholds (`FUZZY_HIGH_THRESHOLD`, `SEMANTIC_THRESHOLD`, etc.)
  were tuned by hand against a 57-row corpus. They will very likely need
  re-tuning once a corpus with thousands of rows (and more near-duplicate
  phrasings) is imported.
- The semantic layer is a general-purpose multilingual sentence embedding
  model, not one fine-tuned on Hindi-Mundari data specifically -- it is
  good at recognising paraphrases, not at inventing correct Mundari it
  hasn't seen.

## Text-to-speech and voice

- No mainstream browser ships a Mundari voice. Audio for Mundari text uses
  the closest available Devanagari-capable voice (typically Hindi) and is
  explicitly labelled as an approximation in the UI -- never presented as a
  verified native recording.
- Voice input (`SpeechRecognition`) and speech output (`SpeechSynthesis`)
  are both non-standard browser APIs with inconsistent support: reliable in
  Chrome/Edge on desktop and Android, unsupported in most other browsers.
  `useSpeechRecognition.ts` / `useSpeechSynthesis.ts` feature-detect this
  and the UI shows an explicit "not supported" state rather than a silently
  broken button.

## Scan & Translate (OCR)

- Tesseract.js OCR accuracy depends heavily on photo quality (lighting,
  angle, focus, font). It works well on clear, high-contrast printed Hindi
  text and poorly on handwriting or low-light photos -- there is no claim
  of production-grade OCR accuracy here.

## Offline support

- "Offline content packs" (Dataset & Offline page) use the standard browser
  Cache API to store one category's data for reuse without a network
  connection. This demonstrates the offline-first principle honestly and
  functionally, but it is not a full installable-PWA-with-service-worker
  implementation with background sync -- that is listed under Future Scope.

## Security / operations

- The rate limiter (`app/core/rate_limit.py`) is a simple in-memory,
  single-process counter. It resets on restart and does not coordinate
  across multiple backend workers/processes -- adequate for a single-machine
  classroom deployment, not for a multi-instance production rollout.
- There is no authentication (see `docs/database.md` for why) -- anyone who
  can reach the API can submit feedback or run translations. Acceptable for
  a local/classroom tool; would need addressing before any public internet
  deployment.
- The optional Bhashini integration (`app/ai/bhashini_stub.py`) is an
  intentional stub, not a live integration -- see that file's docstring for
  the three specific reasons (cost/offline requirement, unconfirmed Mundari
  coverage, and not committing a real API key in a student project).

## Why these limitations are documented here instead of hidden

Per the project's own design principle: a wrong translation silently
presented as correct is worse than no translation at all. The same honesty
extends to the project's own documentation -- a teacher, judge, or examiner
should be able to find exactly what this prototype does and does not do
without having to read the source code first.
