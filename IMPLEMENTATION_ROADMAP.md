# Cybully MVP Implementation and Roadmap

## Current State

The MVP scaffold has been implemented in `C:\Users\HP\Desktop\cybully`.

Completed:

- Root monorepo structure with `apps/web`, `services/api`, and `scripts`.
- Supabase-friendly direct mode for hosted Postgres without Docker.
- Optional Docker Compose for PostgreSQL, RabbitMQ, FastAPI, inference worker, persistence worker, alert worker, and Next.js.
- FastAPI backend with:
  - `POST /api/v1/analyze/text`
  - `GET /api/v1/incidents`
  - `GET /api/v1/incidents/{id}`
  - `PATCH /api/v1/incidents/{id}`
  - `GET /api/v1/alerts`
  - internal token protection via `X-Internal-Token`
- Direct text moderation mode that analyzes and persists in the API request.
- RabbitMQ queue abstraction and optional worker entrypoints:
  - `app.workers.inference`
  - `app.workers.persistence`
  - `app.workers.alerts`
- SQLAlchemy models, Alembic migration, repository helpers, and severity scoring.
- Heuristic mini-project scorer by default, with optional Detoxify model adapter for heavier ML mode.
- Supabase schema SQL in `supabase/schema.sql`.
- Next.js app shell with:
  - Google OAuth through Auth.js
  - `/sign-in`
  - `/app`
  - `/moderation`
  - `/moderation/incidents/[id]`
  - `/settings`
  - BFF API routes that proxy authenticated frontend requests to FastAPI
- Manual demo payloads in `scripts/demo_payloads.http`.
- Localization benchmark fixture in `scripts/localization_samples.json`.
- Root README with setup and demo instructions.

Verification completed:

- `python -m compileall services/api/app` passed.
- Clean frontend dependency installation completed with `npm install`.
- `package-lock.json` was generated.
- `npm run lint:web` passed with no warnings or errors.
- `npm run build:web` passed.
- `npm run test:web` passed.
- Tailwind/PostCSS is now using `apps/web/postcss.config.js` in CommonJS format.
- Backend dependency installation completed with `python -m pip install -e ".[dev]"`.
- `python -m pytest` passed for backend tests.
- FastAPI startup/shutdown now uses a lifespan handler instead of deprecated `on_event` hooks.
- Supabase URL normalization supports async app URLs and sync Alembic URLs with SSL.

Verification not completed:

- Live Supabase connection validation has not been completed because credentials are not present in this workspace.

## Immediate Continuation Instructions

1. Create the local environment file if it does not exist yet.

```powershell
Copy-Item .env.example .env
```

Fill in:

```text
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MODERATOR_EMAILS=your-google-email@example.com
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?ssl=require
PIPELINE_MODE=direct
SCORER_PROVIDER=heuristic
```

Run `supabase/schema.sql` in the Supabase SQL editor before the first API write.

2. Re-run frontend checks after any further UI changes.

```powershell
npm run lint:web
npm run build:web
npm run test:web
```

3. Re-run backend checks after backend changes. Prefer Python 3.11 because the Docker image and ML stack target 3.11.

```powershell
cd services/api
python -m pip install -e ".[dev]"
pytest
```

4. Run the mini-project backend locally.

```powershell
cd services/api
uvicorn app.main:app --reload --port 8000
```

5. Run the frontend.

```powershell
npm run dev:web
```

6. Optional: run the full queue stack later.

```powershell
cd C:\Users\HP\Desktop\cybully
docker compose up --build
```

7. Open the local services.

- Web app: `http://localhost:3000`
- FastAPI docs: `http://localhost:8000/docs`

## Roadmap

### Phase 0: Stabilize the Scaffold

- Commit the generated `package-lock.json` and current frontend fixes.
- Commit the backend packaging/testability fixes.
- Add Supabase credentials and run `supabase/schema.sql`.
- Validate direct mode against live Supabase.

### Phase 1: Validate Supabase Direct Backend

- Start the FastAPI backend locally with `PIPELINE_MODE=direct`.
- Submit sample payloads from `scripts/demo_payloads.http`.
- Confirm FastAPI intake, scoring, Supabase incident rows, and high-severity alert stub rows.

### Phase 1B: Optional Queue Pipeline

- Run RabbitMQ and workers only if the project grows beyond direct mode.
- Set `PIPELINE_MODE=queue` and optionally `SCORER_PROVIDER=detoxify`.

### Phase 2: Validate Frontend App Shell

- Configure Google OAuth redirect URI for `http://localhost:3000/api/auth/callback/google`.
- Sign in with an email listed in `MODERATOR_EMAILS`.
- Submit text from `/app`.
- Verify `/moderation` polls incident and alert APIs every few seconds.
- Open `/moderation/incidents/[id]` and test `reviewed`, `dismissed`, and `escalated` actions.
- Confirm non-moderator users are redirected away from `/moderation`.

### Phase 3: MVP Acceptance Pass

- Run one benign sample, one toxic sample, one repeated-user sample, and one identity-attack sample.
- Confirm each accepted submission returns a tracking id.
- Confirm incidents persist with model scores and severity levels.
- Confirm high-severity incidents create stub alerts.
- Confirm moderator status updates persist after refresh.
- Run the samples in `scripts/localization_samples.json` and document false negatives as Detoxify baseline gaps.

### Phase 4: Hardening After MVP

- Replace stub email alerts with SendGrid.
- Add a proper localization benchmark runner and report artifact.
- Add retry/dead-letter handling for worker failures.
- Add API pagination controls to the frontend.
- Add structured app logging and request correlation ids.
- Add production auth hardening if the FastAPI backend becomes directly reachable from browsers or external clients.

## Known Implementation Notes

- The backend API expects `X-Internal-Token`; the Next.js BFF routes add it automatically.
- Detoxify downloads model weights on first inference. The first worker run can be slow and requires network access.
- The current app shell is intentionally lean and operational. It is not a full social network product.
- Email delivery is stubbed by design; alert events are stored in PostgreSQL instead of being sent.
- The local machine currently reports Python 3.13, but the Docker backend uses Python 3.11. Use Docker or a Python 3.11 environment for the ML stack.
