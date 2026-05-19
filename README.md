# Cybully Safety MVP

This repository implements the 1-week MVP plan from the system design document:

- Next.js app shell with Google OAuth via Auth.js.
- User-facing text submission flow.
- Moderator incident queue, detail view, review actions, and polling refresh.
- FastAPI backend with RabbitMQ ingestion, Detoxify inference, PostgreSQL persistence, and stubbed alert storage.

The MVP is text-only. Image/video moderation, MinIO, vector search, Kubernetes, and production SendGrid delivery are intentionally out of scope.

## Project Layout

```text
apps/web       Next.js App Router frontend and backend-for-frontend routes
services/api   FastAPI app, SQLAlchemy models, Alembic migration, workers, tests
scripts        Manual demo payloads and localization benchmark samples
```

## Local Setup

1. Copy the environment file.

```powershell
Copy-Item .env.example .env
```

2. Fill in Google OAuth values in `.env`.

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
MODERATOR_EMAILS=your-moderator-google-email@example.com
```

3. Start the stack.

```powershell
docker compose up --build
```

4. Open the apps.

- Web app: http://localhost:3000
- FastAPI docs: http://localhost:8000/docs
- RabbitMQ management: http://localhost:15672 with `cybully` / `cybully`

The first inference run downloads the Detoxify model into the container cache. Use `MODEL_INFERENCE_DEVICE=cpu` unless a CUDA-enabled runtime is configured.

## Manual Demo

1. Sign in at http://localhost:3000/sign-in with the Google account listed in `MODERATOR_EMAILS`.
2. Submit text at `/app`.
3. Wait a few seconds for the inference and persistence workers.
4. Review incidents at `/moderation`.
5. Open an incident detail page and mark it reviewed, dismissed, or escalated.
6. Check high-severity alert stubs in the lower panel of `/moderation`.

You can also use `scripts/demo_payloads.http` against the FastAPI service directly. Include `X-Internal-Token` when calling backend endpoints outside the Next.js proxy.

## Backend Development

Install dependencies in a Python 3.11 environment:

```powershell
cd services/api
python -m pip install -e ".[dev]"
pytest
```

Run migrations manually when needed:

```powershell
cd services/api
alembic upgrade head
```

Worker entrypoints:

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

- `POST /api/v1/analyze/text`: enqueue text analysis and return a tracking id.
- `GET /api/v1/incidents`: list incidents with `severity`, `status`, `limit`, and `offset`.
- `GET /api/v1/incidents/{id}`: fetch incident detail.
- `PATCH /api/v1/incidents/{id}`: update moderation status and note.
- `GET /api/v1/alerts`: list stubbed high-severity alerts.

All `/api/v1/*` backend routes require `X-Internal-Token`. The Next.js server routes add it automatically.

