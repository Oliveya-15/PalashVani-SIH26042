# PalashVani admin and permissions package

This archive is a **merged project**, not a loose collection of snippets. It
contains the original PalashVani application, the login/register update, and
the new administrator workflow in the same directory structure.

## What was added

### Administrator console

Open `/admin` after signing in with an administrator account. The console
provides:

- overview cards for accounts, teachers, students, verified entries, pending
  submissions, and feedback;
- searchable teacher/student/admin account management by school and district;
- account suspension/reactivation;
- role changes, with safeguards against removing the last active administrator;
- a moderated content queue;
- a form for entering a Hindi → Mundari proposal;
- approve/reject decisions with a reviewer and timestamp;
- a recent activity/audit log;
- feedback visibility for the government/developer team.

The admin screen is in `frontend/src/admin/`. It is a protected route, but the
real security boundary is the server-side `require_admin` dependency in
`backend/app/api/routes/admin.py`. Hiding the link in the frontend is not
used as authorization.

### Role model

| Role | Intended access |
| --- | --- |
| `student` | learning, dictionary, translation, flashcards, own profile |
| `teacher` | student access plus school profile and learning-content proposals |
| `admin` | governance console, account permissions, audit activity, and content publishing |

Teacher and student accounts may self-register. Administrator accounts cannot
be created from the public registration page; provision one with the CLI
script below. Public learning routes remain available without login so the
existing deployed experience does not break. The meaningful account
difference is protected teacher content intake and the admin console.

### Copyright and dataset control

`POST /api/content/submissions` writes to `content_submissions`, not to the
live dictionary. A submission only enters `translation_entries` after an
administrator calls the approve endpoint. Approval sets `verified=True` and
records the reviewer, decision time, and note. Rejection leaves the live
dataset untouched.

The database additions are:

- `users` from the authentication update;
- `content_submissions` for the review queue;
- `user_activity` for account and governance events.

They are registered before the existing `Base.metadata.create_all()` startup
initialisation. Existing translation, curriculum, and feedback tables are not
destructively replaced.

## Fresh installation

### 1. Copy the project

Extract this archive so its `PalashVani-admin-update/` directory becomes the
project root. No manual file-by-file copying is needed.

### 2. Install backend dependencies

```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
# .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Configure the backend

Copy `.env.example` to `.env`. For local development, SQLite works without
any additional service:

```env
DATABASE_URL=sqlite:///./data/processed/palashvani.db
JWT_SECRET_KEY=replace-with-a-long-random-value
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

Generate a secret instead of using the example value:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

For Render or another hosted deployment, use a managed PostgreSQL database
and set `DATABASE_URL` to its SQLAlchemy URL. Keep the JWT secret in the host's
environment settings; never commit it to GitHub.

For PostgreSQL, use the `postgresql+psycopg://...` form. The PostgreSQL driver
is already included in `backend/requirements.txt`.

### 4. Create the first administrator

Start the backend once so the database tables exist, stop it, then run:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

In another terminal, from the project root:

```bash
python scripts/create_admin.py --name "Department Administrator" --email admin@example.gov.in --password "use-a-strong-password"
```

The script writes a bcrypt password hash and an `admin` role. The plain
password is never stored.

### 5. Run the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Then run:

```bash
npm run dev
```

Visit `http://localhost:5173/login`, sign in with the administrator account,
and open **Admin console** in the left navigation.

## Integrating into an already deployed copy

If the original GitHub repository is already checked out, this archive can be
used as the new working tree. If you prefer to copy changes selectively, the
complete changed/new files are:

### Backend files

```text
backend/app/models/admin.py
backend/app/services/activity_service.py
backend/app/schemas/admin_schemas.py
backend/app/api/routes/content.py
backend/app/api/routes/admin.py
backend/app/database/init_db.py
backend/app/main.py
backend/app/services/auth_service.py
backend/requirements.txt
backend/app/core/config.py
backend/app/core/security.py
backend/app/models/user.py
backend/app/schemas/auth_schemas.py
backend/app/repositories/user_repo.py
backend/app/services/auth_service.py
backend/app/api/routes/auth.py
backend/tests/test_auth.py
scripts/create_admin.py
```

The auth files listed after the first block are already merged into this
archive; do not add a second copy of the same module.

### Frontend files

```text
frontend/src/admin/AdminPage.tsx
frontend/src/components/ProtectedRoute.tsx
frontend/src/components/Sidebar.tsx
frontend/src/api/client.ts
frontend/src/types/index.ts
frontend/src/router.tsx
frontend/src/App.tsx
frontend/src/hooks/useAuth.tsx
frontend/src/pages/Login.tsx
frontend/src/pages/Register.tsx
frontend/src/pages/Profile.tsx
```

The full file contents are present at those paths in this archive. The
`frontend/src/admin/` directory is the requested admin folder.

## Production deployment checklist

1. Set a unique production `JWT_SECRET_KEY` in Render.
2. Use managed PostgreSQL for deployed data; do not rely on an ephemeral
   filesystem for a government-facing deployment.
3. Set backend `CORS_ORIGINS` to the exact Vercel origin, for example:
   `["https://palashvani-sih26042.vercel.app"]`.
4. Install the updated backend requirements and redeploy Render.
5. Deploy the merged frontend to Vercel with
   `VITE_API_BASE_URL=https://palashvani-sih26042-backend.onrender.com/api`.
6. Run `scripts/create_admin.py` against the production database once.
7. Test login, `/admin`, account suspension, a content submission, approval,
   and the public dictionary after deployment.
8. Do not share the administrator password in GitHub, screenshots, chat, or
   deployment logs.

## API reference

All paths below are relative to `/api` and the admin/content endpoints require
`Authorization: Bearer <access_token>`.

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | public | teacher/student registration |
| `POST` | `/auth/login` | public | obtain a JWT |
| `GET` | `/auth/me` | signed in | current profile |
| `POST` | `/content/submissions` | teacher/admin | submit content for review |
| `GET` | `/admin/overview` | admin | governance dashboard |
| `GET` | `/admin/users` | admin | search accounts |
| `PATCH` | `/admin/users/{id}/status` | admin | suspend/reactivate |
| `PATCH` | `/admin/users/{id}/role` | admin | change role |
| `GET` | `/admin/content/submissions` | admin | review queue |
| `POST` | `/admin/content/submissions/{id}/approve` | admin | publish verified entry |
| `POST` | `/admin/content/submissions/{id}/reject` | admin | reject without publishing |
| `GET` | `/admin/activity` | admin | audit events |
| `GET` | `/admin/feedback` | admin | user feedback |

## Verification commands

```bash
cd backend
pytest

cd ../frontend
npm run build
```

The backend test suite contains the original tests plus the authentication
tests from the supplied auth update. Before a real production launch, add
deployment-specific integration tests against a staging PostgreSQL database.