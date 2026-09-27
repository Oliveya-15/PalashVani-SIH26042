# Admin panel -- design notes

Read this alongside `docs/auth-notes.md` from the previous update (still
accurate, unchanged). This document covers everything new in this round.

## Why a separate `admin/` app instead of admin routes inside `frontend/`

Your reference project (Docify_MERN_Deployed) keeps `frontend`, `backend`,
and `admin` as three separate deployable units, and that pattern is used
here for the same reasons it's used there:

- **Blast radius.** A bug in the admin dashboard's dependencies or build
  process can never break the app 1,000+ teachers use for actual
  classroom work, because they're built and deployed independently.
- **Different audiences, different constraints.** The teacher/student app
  is optimized for low-end classroom devices (code-splitting, minimal
  bundle size, offline support). The admin panel has no such constraint --
  it's used by a handful of departmental staff on normal computers, so it
  can afford a table library, charts, etc. without that weight ever
  reaching a student's phone.
- **Separate access control at the infrastructure level.** The admin app
  can be put behind its own URL, and if you ever want to add IP
  allowlisting, a VPN requirement, or a separate auth provider for it
  later, that's a change to one deployment, not a refactor of shared
  routes inside the main app.

It still shares the exact same Tailwind color tokens, fonts, and logo as
the main frontend (see `admin/tailwind.config.js`) specifically so it
reads as "the same product family," not a bolted-on third-party tool.

## Why login is now required everywhere

Previously, translate/search/curriculum/flashcards worked with no
account, and login only unlocked a Profile page. You asked the direct
question: *why would anyone log in if they can already do everything
without it?* That's now fixed -- every content route
(`app/core/rbac.py`'s `require_authenticated`) requires a valid token.
`/api/health`, `/api/auth/register`, and `/api/auth/login` are the only
routes that remain public, for the obvious reason that you can't require
login to reach the login page.

## What teachers can do that students can't (and the one honest caveat)

The **Dataset & Offline** page/stats endpoint (`GET /api/dataset/stats`)
now requires `teacher` or `admin` (`require_teacher_or_admin`) -- it's a
content-management/lesson-prep view (dataset sourcing, licensing,
per-language coverage), not a student learning screen.

**Caveat, stated plainly rather than glossed over:** that page's "download
a category for offline use" feature calls the same
`/api/translations/search` and `/api/flashcards/deck` endpoints that power
the Dictionary and Flashcards features -- which students *are* allowed to
use, by design, since they need to search words and practice flashcards
too. A student cannot reach the Dataset stats page or its UI, but a
technically savvy student could still fetch the same underlying JSON by
calling those shared endpoints directly. Locking that down completely
would mean giving students a *different, restricted* dictionary/flashcard
experience than teachers, which the product doesn't currently call for.
If you want that later, the fix is straightforward: add a `max_page_size`
or a separate `/api/offline-packs/*` route gated to
`require_teacher_or_admin`, rather than reusing the general-purpose search
endpoint for bulk export.

**The reverse direction** (something a student can do that a teacher
can't) doesn't have a natural fit in a tool where the teacher is the
supervisory role over the same learning content -- stated honestly rather
than inventing an arbitrary restriction. If a future feature needs it
(e.g. a student-only practice-streak tracker), the same
`require_roles("student")` pattern in `app/core/rbac.py` adds it in one
line.

## Why a `rights_cleared` flag (the copyright-clearance gate)

You pointed out that the dictionary and curriculum content has real
copyright/licensing implications, and that content should only reach the
public app "with proper right only from admin site." Concretely:

- Every `translation_entries` row now has `rights_cleared` (bool) and
  `rights_note` (free text for citing the license/permission).
- **Every public-facing query is filtered to `rights_cleared = True`** --
  not just hidden in the UI. This is enforced in
  `app/repositories/translation_repo.py` (used by Search, Translate, and
  Flashcards) and in `app/api/routes/curriculum.py` (chapter detail). A
  request crafted by hand against any of those endpoints still can't see
  an uncleared entry.
- New entries added through the admin panel (`POST /api/admin/dataset`)
  default to `rights_cleared = False` -- **unpublished until an admin
  explicitly reviews the citation and clears it.** This is the opposite
  default from the original seed corpus (`scripts/import_dataset.py`,
  unchanged), which is trusted, already-cited data and keeps its existing
  `rights_cleared = True` default -- see that script's own comments.
- Every clearance change (and every dataset/user/curriculum write) is
  recorded in the new `audit_log` table, visible on the admin panel's
  Audit Log page -- so "who cleared this, and when" is always answerable.

## Why the auto-seed-on-boot pattern had to go

This is worth explaining in full, because it points at a real bug, not
just an inefficiency. Render's free/standard web services (without a paid
persistent-disk add-on) use an **ephemeral filesystem** -- anything
written to disk, including a SQLite database file, disappears on the next
deploy or automatic restart (which happens after periods of inactivity on
the free tier). Wrapping schema creation and data seeding into the app's
own startup event, as the original `init_db()` did, was a reasonable way
to make sure a *fresh* deployment always has its reference data -- but the
side effect is that **every restart silently discarded any data written
since the last deploy, including every registered user account.** That's
almost certainly the actual bug behind needing to "hardcode" seeding on
every load: the workaround was compensating for data loss, not avoiding
it.

The fix has two parts:

1. **Move off ephemeral SQLite in production.** See "Neon Postgres" below.
2. **Stop tying schema/seed logic to the app process starting up at all.**
   Schema is now Alembic migrations (`backend/migrations/`), applied
   explicitly once per deploy. Reference-data seeding is now
   `scripts/seed_reference_data.py`, also run explicitly once per deploy.
   `app/main.py`'s startup event no longer touches the database.

## Why Neon (Postgres), not MongoDB

You mentioned both as options. Postgres via Neon was chosen, not MongoDB,
for a concrete technical reason: **the entire backend is built on
SQLAlchemy's relational ORM** -- foreign keys between users, translation
entries, curriculum chapters, feedback, and audit logs; joins for the
Grade→Subject→Chapter tree; relational integrity enforced at the database
level. Moving to MongoDB (a document database with no native joins or
foreign keys) would mean rewriting every model and every repository
query, for no functional benefit -- the data is inherently relational.
Switching to Postgres, by contrast, is a **one-line change**
(`DATABASE_URL`) because SQLAlchemy already abstracts the SQL dialect --
see `docs/database.md` from the original project, which flagged this
exact migration path from day one. Neon specifically: genuinely free tier
sufficient for this project's scale, serverless (no server to manage),
and connects with the same `psycopg2` driver every other hosted Postgres
uses.

## Why Alembic (and why two migrations, not one)

`alembic` was already in `requirements.txt` from the very first delivery,
unused until now. Introducing it properly means future schema changes are
tracked, reversible, and safe to run against a database that already has
real user data -- unlike `Base.metadata.create_all()`, which can create
missing tables but silently does nothing to tables that already exist
(meaning it could never have added the new `rights_cleared` column to
your live `translation_entries` table, even if you'd just updated the
model file). Two migrations:

- **`0001_baseline.py`** does nothing (no tables, no columns) -- it exists
  purely to give Alembic a starting point to `stamp` your already-existing
  schema against, without trying to recreate tables that are already
  there.
- **`0002_admin_panel.py`** makes the actual changes (rights-clearance
  columns, activity-attribution columns, the `users` and `audit_log`
  tables), written defensively (checks what already exists before acting)
  since different deployments may have slightly different starting
  points.

## Audit logging: what's captured, what isn't

Every write through `/api/admin/*` calls `log_action()`
(`app/services/audit_service.py`) with who did it, what action, what it
targeted, and a short human-readable summary. What's **not** captured:
reads (viewing the user list isn't logged -- only changes are), and
teacher/student activity isn't in the audit log (it's in
`translation_history`/`feedback` via the new `user_id` columns instead,
which is what the Dashboard's "active users" and per-user activity counts
come from -- a parallel, unified list would be a reasonable future
addition, not built here to keep this update's scope contained).

## What was deliberately left out of this update

- **Bulk CSV import UI in the admin panel.** `scripts/import_dataset.py`
  (CLI, unchanged) remains the bulk-import path for a large, pre-cited
  corpus. Building a drag-and-drop bulk uploader with per-row validation
  in the admin UI is a reasonable next step, not done here to keep this
  update reviewable.
- **Fine-grained curriculum reordering (drag-and-drop).** Chapters have an
  `order_index` the API already respects; the admin UI edits it only
  indirectly (new chapters append to the end). A drag-and-drop reorder
  control is a UI-only addition on top of what's already there.
- **Charts/analytics beyond the Dashboard's stat cards.** `recharts` is
  already a dependency (unused so far) specifically so adding a real
  chart later doesn't require a new package.
- **Multi-admin permission tiers** (e.g. "read-only admin" vs "full
  admin"). Right now, `admin` is one flat role. `app/core/rbac.py`'s
  `require_roles()` pattern generalizes to more granular roles if that's
  ever needed.
