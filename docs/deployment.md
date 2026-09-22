# Deployment

Local execution (see the README) never depends on any of this -- these are
options for putting a live link in front of judges/reviewers, all
free-tier-compatible, matching the SIH pitch's own "Services & Deploy"
slide (Vercel + Render, free tiers throughout).

## Frontend: static hosting (Vercel / Netlify / GitHub Pages / Cloudflare Pages)

The frontend builds to a plain static site:

```bash
cd frontend
npm run build      # outputs to frontend/dist/
```

Any static host works. For Vercel/Netlify: set the project root to
`frontend/`, build command `npm run build`, output directory `dist`. Set
`VITE_API_BASE_URL` (see `frontend/.env.example`) to your deployed
backend's URL, since the dev-only `/api` proxy in `vite.config.ts` does not
exist in a static production build.

## Backend: any container or Python host (Render / Railway / Fly.io)

The included `backend/Dockerfile` (context: project root) is host-agnostic:

```bash
docker build -f backend/Dockerfile -t palashvani-backend .
docker run -p 8000:8000 -v $(pwd)/data:/app/data palashvani-backend
```

For a platform without Docker support, the equivalent commands are:

```bash
pip install -r backend/requirements.txt
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Remember to set `CORS_ORIGINS` to your deployed frontend's exact URL once
both are live, or the browser will block requests.

## Database in a hosted deployment

SQLite works for a demo but its data file will not survive most
platforms' ephemeral filesystems (e.g. a fresh container on every deploy).
For anything beyond a local demo, provision a free-tier PostgreSQL instance
(Render, Railway, Neon, and Supabase all currently offer one) and set
`DATABASE_URL` accordingly -- see `docs/database.md` for the one-line
migration.

## What is intentionally NOT covered here

Mobile app store distribution, a CDN for audio assets, and managed
authentication (Firebase/Auth0, as named in the original PPT's "Services &
Deploy" slide) are out of scope for this academic prototype -- see
`docs/limitations.md` and the About page's Future Scope section.
