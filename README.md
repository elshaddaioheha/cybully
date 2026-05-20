# Cybully Safety MVP

This repository implements the 1-week MVP plan from the system design document:

- Next.js app shell with Supabase email/password auth and SSR session handling.
- User-facing text submission flow.
- Moderator incident queue, detail view, review actions, and polling refresh.
- FastAPI backend with Supabase Postgres persistence, direct mini-project processing, optional RabbitMQ workers, and stubbed alert storage.

The MVP is text-only. Image/video moderation, MinIO, vector search, Kubernetes, and production SendGrid delivery are intentionally out of scope.

## Project Layout

```text
apps/web       Next.js App Router frontend and backend-for-frontend routes
services/api   FastAPI app, SQLAlchemy models, Alembic migration, workers, tests
scripts        Manual demo payloads and localization benchmark samples
```

## Supabase Mini-Project Setup

1. Copy the environment file.

```powershell
Copy-Item .env.example .env
```

2. Create a Supabase project and run `supabase/schema.sql` in the Supabase SQL editor.

3. Put your Supabase Postgres Session Pooler connection string into `.env`.

```text
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PERCENT_ENCODED_PASSWORD@aws-1-YOUR-REGION.pooler.supabase.com:5432/postgres?sslmode=require
PIPELINE_MODE=direct
SCORER_PROVIDER=auto
```

`PIPELINE_MODE=direct` removes the need for Docker, RabbitMQ, and local PostgreSQL. The API processes the text and persists the incident during the request.
If your database password contains reserved characters such as `$` or `%`, percent-encode them in `DATABASE_URL`.

4. Configure backend and moderator values in `.env`.

```text
MODERATOR_EMAILS=your-moderator-email@example.com
```

If you change `.env` while the API is already running, restart `uvicorn`. The SQLAlchemy engine is created at startup, so the running process will not pick up a new `DATABASE_URL` until restart.
5. Create `apps/web/.env.local` for the public Supabase web keys.

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-supabase-publishable-key
```

6. Install and run the backend.

```powershell
cd services/api
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

7. Install and run the frontend.

```powershell
npm install
npm run dev:web
```

8. Open the apps.

- Web app: http://localhost:3000
- FastAPI docs: http://localhost:8000/docs

For this mini-project setup, `SCORER_PROVIDER=auto` uses Detoxify when the ML dependency is available, and automatically falls back to the local heuristic scorer if Detoxify is unavailable or fails to initialize. To force Detoxify only, set `SCORER_PROVIDER=detoxify` and install `python -m pip install -e ".[dev,ml]"`.

## Backend Deployment (Render)

The repository includes a Render Blueprint at `render.yaml` for the FastAPI backend.

1. In Render, create a new Blueprint service from this repository.
2. Confirm the service uses `services/api/Dockerfile`.
3. Set required secrets in Render:
   - `DATABASE_URL` (Supabase session pooler URL with `sslmode=require`)
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `BACKEND_INTERNAL_TOKEN`
   - `ALLOWED_CORS_ORIGINS` (set to your deployed frontend URL)
   - `ADMIN_NOTIFICATION_EMAIL`
4. Deploy. The container startup script runs `alembic upgrade head` before booting Uvicorn.

Health check endpoint: `GET /health`

## Manual Demo

1. Open http://localhost:3000.
2. Sign in with a Supabase email/password account, or create one at `/sign-up`.
3. New sign-ups must confirm their email before sign-in when Supabase email confirmation is enabled.
4. To preview moderator screens immediately, sign in with an email listed in `MODERATOR_EMAILS`.
5. Submit text at `/app`.
6. In direct mode, the API writes the incident to Supabase during the request and returns a tracking id.
7. Review incidents at `/moderation`.
8. Open an incident detail page and mark it reviewed, dismissed, or escalated.
9. Check high-severity alert stubs in the lower panel of `/moderation`.

You can also use `scripts/demo_payloads.http` against the FastAPI service directly. Prefer a Supabase bearer token for user-scoped calls. `X-Internal-Token` remains available as a fallback for local service-to-service or manual script use.

## Backend Development

Install dependencies in a Python 3.11 environment:

```powershell
cd services/api
python -m pip install -e ".[dev]"
pytest
```

If you prefer Alembic over the Supabase SQL editor, run migrations manually:

```powershell
cd services/api
alembic upgrade head
```

Optional RabbitMQ worker entrypoints for future queue mode:

```powershell
python -m app.workers.inference
python -m app.workers.persistence
python -m app.workers.alerts
```

## Frontend Development

Install and run the Next.js app:

```powershell
npm install
npm run dev:web
```

Useful checks:

```powershell
npm run lint:web
npm run build:web
npm run test:web
```

## Localization Benchmark

`scripts/localization_samples.json` contains a small Nigerian Pidgin/code-mixed sample set for the MVP benchmark. For the sprint acceptance pass, run these texts through `/app` or `scripts/demo_payloads.http`, compare the expected risk labels with the persisted model output, and record false negatives as known Detoxify baseline gaps.

## API Summary

- `POST /api/v1/analyze/text`: analyze text directly in mini mode, persist it, and return a tracking id.
- `GET /api/v1/incidents`: list incidents with `severity`, `status`, `limit`, and `offset`.
- `GET /api/v1/incidents/{id}`: fetch incident detail.
- `PATCH /api/v1/incidents/{id}`: update moderation status and note, with reviewer identity and moderation timestamp persistence.
- `GET /api/v1/alerts`: list stubbed high-severity alerts.

All `/api/v1/*` backend routes require either a Supabase bearer token or `X-Internal-Token`. The Next.js server routes now forward the signed-in user's Supabase access token to FastAPI.

## Current Status

- Landing page, sign-in, sign-up, submit flow, moderation list, incident detail, and settings screens are implemented.
- Supabase email/password auth is live.
- FastAPI bearer-token validation against Supabase Auth is live.
- Direct-mode incident persistence to Supabase Postgres is working with the Session Pooler configuration.
- Stub alert persistence is wired, but production email delivery is still intentionally out of scope.

## Optional Queue Mode

The original asynchronous RabbitMQ pipeline is still available. Set:

```text
PIPELINE_MODE=queue
SCORER_PROVIDER=detoxify
RABBITMQ_URL=...
```

Then run the API plus `app.workers.inference`, `app.workers.persistence`, and `app.workers.alerts`. The included `docker-compose.yml` remains available for a fuller local infrastructure setup, but it is no longer required for the Supabase mini-project path.
