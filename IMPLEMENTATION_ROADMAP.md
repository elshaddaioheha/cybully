# Cybully MVP Implementation and Roadmap

## Current State

The MVP scaffold has been implemented in `C:\Users\HP\Desktop\cybully`.

Completed:

- Root monorepo structure with `apps/web`, `services/api`, and `scripts`.
- Supabase direct mode for hosted Postgres without requiring Docker Desktop.
- Optional Docker Compose for the fuller queue-based stack, but it is no longer the default path.
- FastAPI backend with:
  - `POST /api/v1/analyze/text`
  - `GET /api/v1/incidents`
  - `GET /api/v1/incidents/{id}`
  - `PATCH /api/v1/incidents/{id}`
  - `GET /api/v1/alerts`
  - Supabase bearer-token validation against Supabase Auth
  - `X-Internal-Token` fallback for local service-to-service calls
- Direct text moderation mode that analyzes and persists in the API request.
- RabbitMQ queue abstraction and optional worker entrypoints:
  - `app.workers.inference`
  - `app.workers.persistence`
  - `app.workers.alerts`
- SQLAlchemy models, Alembic migration, repository helpers, and severity scoring.
- Heuristic mini-project scorer by default, with optional Detoxify model adapter for heavier ML mode.
- Supabase schema SQL in `supabase/schema.sql`.
- Next.js app shell with:
  - Supabase email/password auth
  - public landing page at `/`
  - `/sign-in`
  - `/sign-up`
  - `/app`
  - `/moderation`
  - `/moderation/incidents/[id]`
  - `/settings`
  - BFF API routes that proxy authenticated frontend requests to FastAPI
- Manual demo payloads in `scripts/demo_payloads.http`.
- Localization benchmark fixture in `scripts/localization_samples.json`.
- Root README with setup and demo instructions.

Verification completed:

- `npm run lint:web` passed with no warnings or errors.
- `python -m pytest` passed for backend tests.
- `POST /api/v1/analyze/text` returned `202 Accepted` against the live FastAPI service.
- Incident rows are persisting into Supabase Postgres in direct mode.
- Live setup works with the Supabase Session Pooler connection string.

Verification not completed:

- Real end-to-end browser verification of the signed-in submit flow after the final API restart has not yet been repeated.
- Moderator review actions against real signed-in traffic still need one focused pass.

## Immediate Continuation Instructions

1. Create the local environment file if it does not exist yet.

```powershell
Copy-Item .env.example .env
```

Fill in:

```text
MODERATOR_EMAILS=your-google-email@example.com
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PERCENT_ENCODED_PASSWORD@aws-1-YOUR-REGION.pooler.supabase.com:5432/postgres?sslmode=require
PIPELINE_MODE=direct
SCORER_PROVIDER=heuristic
```

Run `supabase/schema.sql` in the Supabase SQL editor before the first API write.
If the password contains `$` or `%`, percent-encode it before placing it into `DATABASE_URL`.

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
uvicorn app.main:app --port 8000
```

If you update `.env`, restart the API process so the engine is rebuilt with the new `DATABASE_URL`.

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

- Keep README, env examples, and roadmap aligned with the Supabase mini-project path.
- Keep the live API process restarted after env changes.
- Re-run one signed-in browser submit after backend restarts to confirm the BFF path is healthy.

### Phase 1: Validate Supabase Direct Backend

- Start the FastAPI backend locally with `PIPELINE_MODE=direct`.
- Submit sample payloads from `scripts/demo_payloads.http` or `/app`.
- Confirm FastAPI intake, scoring, Supabase incident rows, and high-severity alert stub rows.
- Confirm moderator review status changes persist to Supabase.

### Phase 1B: Optional Queue Pipeline

- Run RabbitMQ and workers only if the project grows beyond direct mode.
- Set `PIPELINE_MODE=queue` and optionally `SCORER_PROVIDER=detoxify`.

### Phase 2: Validate Frontend App Shell

- Sign in with a Supabase email/password account listed in `MODERATOR_EMAILS`.
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

- The preferred auth path is now Supabase bearer token forwarding from the Next.js BFF to FastAPI.
- `X-Internal-Token` remains available for local scripts and internal calls.
- Detoxify downloads model weights on first inference. The first worker run can be slow and requires network access.
- The current app shell is intentionally lean and operational. It is not a full social product.
- Email delivery is stubbed by design; alert events are stored in PostgreSQL instead of being sent.
- The local machine currently reports Python 3.13. The heavier ML path is still safer on Python 3.11 if you later enable Detoxify.
