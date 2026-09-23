# PalashVani

**Hindi → Mundari translation and mother-tongue FLN classroom companion.**
Built for Smart India Hackathon 2026, Problem Statement **SIH26042** — *"AI-
Powered Vernacular Pedagogy and Real-Time Translation Tool for Mother
Tongue-Based Primary Education,"* for Jharkhand's PALASH primary-schools
network.

> Every translation this app produces says exactly how it was made:
> a verified dataset match, a fuzzy match, or an AI-assisted semantic
> match — and it never silently guesses. See [`docs/ai-pipeline.md`](docs/ai-pipeline.md).

---

## Table of contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation (Windows / VS Code)](#installation-windows--vs-code)
- [Database Setup](#database-setup)
- [Dataset Setup](#dataset-setup)
- [Environment Variables](#environment-variables)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Running Tests](#running-tests)
- [Production Build](#production-build)
- [API Documentation](#api-documentation)
- [AI/NLP Pipeline](#ainlp-pipeline)
- [Dataset Information](#dataset-information)
- [Voice & Scan Features](#voice--scan-features)
- [SEO](#seo)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [Future Scope](#future-scope)
- [Academic / Viva Explanation](#academic--viva-explanation)
- [License](#license)

---

## Problem Statement

Over 5,000 tribal-area primary schools in Jharkhand teach in a language
many children don't speak at home, while the Hindi-medium-trained teachers
posted to them often have no fluency in Ho, Mundari, or Santali. Digital
NLP resources for these languages remain limited, and existing edtech is
online-only and Hindi/English-first. Full text: [`docs/demo.md`](docs/demo.md)
and the original PPT (`SIH26042_Final.pptx`, supplied separately).

## Solution

PalashVani lets a teacher type, speak, or photograph Hindi classroom text
and get a Mundari result — sourced from a verified, curated dictionary
first, with AI-assisted semantic matching only when no dataset match
exists, and an honest "no verified match" when neither can answer. The
same verified phrases are also organised into a Grade → Subject → Chapter
browsing structure, a flashcard practice mode, and a searchable dictionary
— all usable offline once a category has been downloaded once.

**Language choice:** Mundari was chosen as the prototype language (Hindi →
Mundari direction) because it has the strongest available reference
material of the three PPT-named languages; the architecture (see
`languages` table, `docs/database.md`) already supports adding Ho and
Santali the same way once a corpus exists for each — nothing about the
code is Mundari-specific.

## Key Features

- **Verified-first hybrid translation** — normalize → exact match → fuzzy
  match → optional AI semantic match → honest "no match." Never a silent
  guess. ([`docs/ai-pipeline.md`](docs/ai-pipeline.md))
- **Scan & Translate** — photograph or upload a page of Hindi text;
  Tesseract.js extracts it entirely in the browser (no server upload, no
  paid OCR API).
- **Voice input & text-to-speech** — browser-native Web Speech API, with
  real feature detection and honest "not supported here" states.
- **Searchable dictionary** — paginated, filterable, debounced search over
  the verified corpus.
- **Curriculum browser** — Grade → Subject → Chapter, reusing the same
  verified rows as content units.
- **Flashcards** — flip-card vocabulary practice by category.
- **Dataset & Offline page** — real (not fabricated) per-language counts
  and category breakdown, plus one-click offline content packs via the
  browser's Cache API.
- **Bilingual UI** — complete English/Hindi interface via a lightweight
  custom i18n layer (182 keys, `frontend/src/i18n/`).
- **Sidebar navigation** — fixed sidebar on desktop, slide-out drawer on
  mobile — full keyboard navigation, visible focus states,
  `prefers-reduced-motion` support, semantic HTML throughout.
- **Zero paid dependencies** — see [Security](#security) and
  [`docs/limitations.md`](docs/limitations.md).

## Technology Stack

| Layer | Choice | Why (see `docs/architecture.md` for the full rationale) |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS | Fast dev loop, strict typing, small production bundles |
| Routing | React Router v6 (lazy-loaded routes) | Code-splitting for low-end classroom devices |
| Server state | TanStack Query | Caching, loading/error states, no hand-rolled data fetching |
| Backend | Python 3 + FastAPI | Free automatic OpenAPI docs, async, Pydantic validation — matches the PPT's own tech slide |
| Database | SQLite (default) → PostgreSQL-ready | Zero setup for local/offline use; one env var to migrate |
| AI/NLP | `sentence-transformers` (MiniLM, optional) + `rapidfuzz`/`difflib` | Real semantic matching, CPU-only, fully offline after first model download |
| OCR | Tesseract.js (browser, WASM) | Zero-cost, no server round-trip for images |
| Voice | Web Speech API (browser-native) | Zero-cost, no paid speech API required |
| Testing | Pytest + httpx (backend), Vitest + Testing Library (frontend) | |

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full diagram and
every major design decision explained. One-line summary:

```
Teacher's browser → React frontend → REST API → FastAPI backend
   → hybrid translation pipeline → SQLite/PostgreSQL
```

## Project Structure

```
palashvani/
├── frontend/           React + TypeScript + Vite + Tailwind app
│   └── src/{components,pages,hooks,i18n,api,types,utils,layouts}
├── backend/             FastAPI app
│   └── app/{api,core,models,schemas,services,repositories,translation,ai,database}
├── data/                 raw/ (source CSVs) · processed/ (generated DB, gitignored)
├── scripts/              validate_dataset.py · import_dataset.py · seed_curriculum.py
├── docs/                  architecture, api, database, ai-pipeline, limitations, deployment, demo
├── docker-compose.yml     optional
├── .env.example
└── README.md              (this file)
```

Every folder exists for a stated reason — see `docs/architecture.md` and
`docs/database.md` for "why this file/table exists" call-outs throughout.

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ (ships with Node) | `npm --version` |
| Git | any recent | `git --version` |
| Docker Desktop | optional, only if you want containers | `docker --version` |

No paid account, API key, or database server is required for local use.

## Installation (Windows / VS Code)

Open the project folder in VS Code, then open **two PowerShell terminals**
(Terminal → New Terminal, then click the `+` again for a second one).

**Terminal 1 — backend setup:**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> If PowerShell blocks the activation script with an execution-policy
> error, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once,
> then retry.

**Terminal 2 — frontend setup:**

```powershell
cd frontend
npm install
```

(macOS/Linux: replace `.venv\Scripts\Activate.ps1` with `source .venv/bin/activate`; every other command is identical.)


## Database Setup

Nothing to install. The backend creates `data/processed/palashvani.db`
(SQLite) automatically on first run, with all tables and reference rows
(languages, grades) — see `backend/app/database/init_db.py`. To use
PostgreSQL instead, see [`docs/database.md`](docs/database.md).

## Dataset Setup

Run these **once**, from the project root, with the backend's virtual
environment active (Terminal 1 from above):

```powershell
cd ..                                                 # back to the project root
python scripts/validate_dataset.py data/raw/hindi_mundari_seed.csv
python scripts/import_dataset.py data/raw/hindi_mundari_seed.csv --target mundari
python scripts/seed_curriculum.py
```

This validates, then imports, the 57-row sourced seed corpus (see
[`data/README.md`](data/README.md) for exactly where every row comes from),
then links a subset of it into the Curriculum browsing structure. All
three scripts are safe to re-run at any time.

## Environment Variables

Copy `.env.example` to `.env` in the project root and adjust if needed —
**every setting has a safe default**, so this step is optional for local
use. Every variable is documented inline in `.env.example`. Highlights:

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | local SQLite file | See `docs/database.md` for PostgreSQL |
| `ENABLE_SEMANTIC_SEARCH` | `true` | Set `false` to skip the optional AI model entirely |
| `BHASHINI_ENABLED` | `false` | Optional external fallback, never required |
| `CORS_ORIGINS` | `localhost:5173` | Update if you serve the frontend elsewhere |

## Running the Backend

Terminal 1 (venv active, inside `backend/`):

```powershell
uvicorn app.main:app --reload --port 8000
```

Leave this running. Swagger docs: http://localhost:8000/docs

## Running the Frontend

Terminal 2 (inside `frontend/`):

```powershell
npm run dev
```

Open **http://localhost:5173** — the dev server proxies `/api` calls to
the backend automatically (see `frontend/vite.config.ts`).

## Running Tests

**Backend** (Terminal 1, inside `backend/`, venv active):

```powershell
pytest
```

Runs against an isolated in-memory database (see `backend/tests/conftest.py`)
— never touches your real `data/processed/palashvani.db`.

**Frontend** (Terminal 2, inside `frontend/`):

```powershell
npm test
```

## Production Build

**Frontend:**

```powershell
cd frontend
npm run build      # outputs static files to frontend/dist/
npm run preview    # serve the production build locally to sanity-check it
```

**Backend:**

```powershell
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

(drop `--reload`, which is a development-only flag). See
[`docs/deployment.md`](docs/deployment.md) for hosting options (Vercel,
Render, Docker), all free-tier compatible.


## After Implementation 

**Terminal 1 — backend setup:**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend setup:**

```powershell
cd frontend
npm run dev
```

**For Testing:**
```test100100@gmail.com
password123
```


## API Documentation

Auto-generated interactive docs at `/docs` (Swagger) and `/redoc` while the
backend runs. Endpoint-by-endpoint explanation: [`docs/api.md`](docs/api.md).

## AI/NLP Pipeline

Full explanation, including exactly what is and isn't machine learning in
this system and why: [`docs/ai-pipeline.md`](docs/ai-pipeline.md).

## Dataset Information

57 hand-sourced, citation-backed Hindi–Mundari pairs across 8 categories.
Full sourcing, licensing notes, and how to import a larger production
corpus: [`data/README.md`](data/README.md).

## Voice & Scan Features

Voice input/output uses the browser-native Web Speech API; Scan & Translate
uses Tesseract.js (WASM OCR) entirely client-side. Both are feature-detected
at runtime with honest "not supported in this browser" states — see
`frontend/src/hooks/useSpeechRecognition.ts`,
`useSpeechSynthesis.ts`, and `frontend/src/pages/Translate.tsx`. Browser
support varies; Chrome/Edge on desktop or Android is most reliable.

## SEO

Semantic HTML, a proper heading hierarchy, descriptive `<title>`/meta
description, Open Graph + Twitter card metadata, `robots.txt`, and
`sitemap.xml` are all in `frontend/index.html` and `frontend/public/`.

## Security

- No secrets are committed anywhere; `.env` is gitignored and `.env.example`
  contains no real values.
- Input validation on every endpoint via Pydantic schemas.
- CORS is explicitly allow-listed (`CORS_ORIGINS`), not wildcarded.
- A dependency-free rate limiter (120 req/min/IP by default) —
  `backend/app/core/rate_limit.py`.
- Unhandled exceptions are logged server-side with full detail but return
  only a generic message to the client — no stack traces ever reach the
  browser (`backend/app/main.py`).
- No paid API key is ever required for the core app to function; the one
  optional external integration (Bhashini) is disabled unless explicitly
  configured — see `backend/app/ai/bhashini_stub.py`.


## Troubleshooting

| Symptom | Fix |
|---|---|
| `uvicorn: command not found` | Activate the virtual environment first (`.venv\Scripts\Activate.ps1`) |
| PowerShell won't run `Activate.ps1` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then retry |
| Frontend shows "Could not reach the PalashVani server" | Make sure Terminal 1's `uvicorn` is still running on port 8000 |
| `pip install` fails on `sentence-transformers` | The app works without it — set `ENABLE_SEMANTIC_SEARCH=false` in `.env`, or simply ignore the failure and reinstall the rest with `pip install -r requirements.txt` minus that one line |
| Translations always say "No verified match" | Run the [Dataset Setup](#dataset-setup) import scripts — the database starts empty until you do |
| Port 5173 or 8000 already in use | `npm run dev -- --port 5174` / `uvicorn app.main:app --port 8001 --reload` (update the Vite proxy target accordingly) |
| Voice/Scan buttons show "not supported" | Expected outside Chrome/Edge — see [Limitations](#limitations) |

## Limitations

Stated honestly, in full, in [`docs/limitations.md`](docs/limitations.md) —
covering dataset size, translation quality, TTS accuracy, OCR accuracy,
offline scope, and security scope.

## Future Scope

Ho and Santali corpora, a much larger verified Hindi-Mundari corpus via
formal partnership (JCERT/PALASH, per the original PPT's rollout roadmap),
a fine-tuned neural translation model, offline (on-device) speech
synthesis, and a full installable-PWA service worker are the natural next
steps on this same architecture — see the About page and
`docs/limitations.md`.

## Academic / Viva Explanation

Short answers to the questions most likely to come up; see
`docs/architecture.md` and `docs/ai-pipeline.md` for the full versions.

- **"Why FastAPI?"** Free automatic OpenAPI docs, async support, Pydantic
  validation — and it's what the source PPT's own tech slide specifies.
- **"Why SQLite, not PostgreSQL?"** Zero setup for an offline classroom
  tool; one environment variable migrates it later — see `docs/database.md`.
- **"Is the AI real, or just string matching?"** Both, layered on purpose:
  deterministic normalize/exact/fuzzy stages first (auditable, always
  tried first), then a real sentence-embedding transformer
  (`sentence-transformers`, MiniLM) for semantic matches the fuzzy stage
  can't catch — see `docs/ai-pipeline.md`.
- **"How is confidence calculated?"** Exact = 1.0; fuzzy = string
  similarity ratio; semantic = cosine similarity between sentence
  embeddings — bucketed into high/medium/low and always shown, plus a
  separate `ai_assisted` flag.
- **"What happens with no internet?"** Everything except the semantic
  model's one-time download and the (disabled-by-default) Bhashini
  fallback — see `docs/demo.md`, "If the internet is down at demo time."
- **"How do you add Ho or Santali?"** Add a row to the `languages` table,
  source and import a CSV in the same schema via
  `scripts/import_dataset.py --target ho` — no other code changes needed.
- **"What are the current limitations?"** See
  [`docs/limitations.md`](docs/limitations.md) — stated in full, not
  glossed over.

## License

MIT (see [`LICENSE`](LICENSE)) for the code. The seed dataset has its own,
separate sourcing/licensing note — see [`data/README.md`](data/README.md).
