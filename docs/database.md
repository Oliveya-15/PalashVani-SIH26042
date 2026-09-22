# Database

## Entity-relationship overview

```mermaid
erDiagram
    LANGUAGES ||--o{ TRANSLATION_ENTRIES : "source/target"
    LANGUAGES ||--o{ DATASET_METADATA : "describes"
    CURRICULUM_GRADES ||--o{ CURRICULUM_SUBJECTS : has
    CURRICULUM_SUBJECTS ||--o{ CURRICULUM_CHAPTERS : has
    CURRICULUM_CHAPTERS ||--o{ TRANSLATION_ENTRIES : "optionally links"
    TRANSLATION_ENTRIES ||--o{ TRANSLATION_HISTORY : "matched by"
    TRANSLATION_HISTORY ||--o{ FEEDBACK : "optionally about"

    LANGUAGES {
        int id PK
        string code UK
        string name_en
        string name_hi
        string script
        bool is_tribal
        string status
        bool bhashini_supported
    }
    TRANSLATION_ENTRIES {
        int id PK
        int source_language_id FK
        int target_language_id FK
        text source_text
        text target_text
        text normalized_source
        string category
        string transliteration
        string source_citation
        bool verified
        int chapter_id FK "nullable"
    }
    CURRICULUM_GRADES {
        int id PK
        int grade_number UK
    }
    CURRICULUM_SUBJECTS {
        int id PK
        int grade_id FK
    }
    CURRICULUM_CHAPTERS {
        int id PK
        int subject_id FK
        int order_index
    }
    TRANSLATION_HISTORY {
        int id PK
        text source_text
        string method
        float confidence
        int matched_entry_id FK "nullable"
    }
    FEEDBACK {
        int id PK
        text message
        int rating "nullable, 1-5"
        int translation_history_id FK "nullable"
    }
    DATASET_METADATA {
        int id PK
        int language_id FK
        int total_pairs
        string source
        string license
    }
```

## Why each table exists (and why nothing extra does)

- **`languages`** -- a single source of truth for every language the UI can
  mention, including ones with no data yet (`status='planned'`, e.g. Ho and
  Santali). This is what lets the Dataset page truthfully show "planned"
  rather than hiding a language the architecture already supports.
- **`translation_entries`** -- the actual parallel corpus. `normalized_source`
  is a stored, indexed column (not computed at query time) specifically so
  exact-match lookups stay O(1)-ish even as the corpus grows into the
  tens of thousands of rows the production version targets.
- **`curriculum_grades` / `_subjects` / `_chapters`** -- a plain three-level
  tree. A chapter does **not** store its own copy of content text; it is
  linked to *from* `translation_entries.chapter_id` (nullable). This
  single design decision is why Search, Translate, and Curriculum can never
  disagree about what a phrase translates to -- there is only one row.
- **`translation_history`** -- exists so the Dataset & Offline page's
  "verified pairs" and category counts are **real counts from real usage**,
  not display-only numbers -- directly satisfying the "no fake statistics"
  requirement.
- **`feedback`** -- deliberately minimal (message, optional 1-5 rating,
  optional link back to the translation that prompted it). No user account
  is attached because the app has no authentication -- see below.
- **`dataset_metadata`** -- one row per language recording *where its data
  came from* (`source`), under what terms (`license`), and when it was last
  refreshed -- populated automatically by `scripts/import_dataset.py`, never
  hand-typed.

## Why no `users` table / authentication

The SIH problem statement describes a tool teachers use directly on shared
or personal devices in a classroom, with no described requirement for
login, per-teacher history, or access control. Adding authentication here
would mean password storage, session/token handling, and a login screen
that gates a tool meant to be opened and used in seconds -- complexity with
no corresponding requirement. If a future version needs per-teacher saved
history, `translation_history` already has the right shape to add a
nullable `user_id` column without a migration that touches existing rows.

## SQLite today, PostgreSQL later

Every table above is defined once, in SQLAlchemy's ORM
(`backend/app/models/models.py`), not in raw SQL. Switching the backing
database is a **single environment variable**:

```
# .env
DATABASE_URL=postgresql+psycopg2://palashvani:palashvani@localhost:5432/palashvani
```

plus adding `psycopg2-binary` to `backend/requirements.txt`. No application
code changes. The one thing SQLite-specific in the codebase is the
`PRAGMA foreign_keys=ON` call in `app/database/session.py` (SQLite disables
foreign-key enforcement by default; PostgreSQL does not need this and the
code only runs it when `DATABASE_URL` starts with `sqlite`).

`backend/requirements.txt` already includes `alembic` for exactly this
transition: once real data exists in a shared environment,
`Base.metadata.create_all()` (used today for its simplicity -- see
`app/database/init_db.py`) should be replaced with an Alembic migration
chain so schema changes don't require dropping data.
