from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import logging
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import AuthContext, require_internal_token, require_moderator_token
from app.db import get_session
from app.ml.factory import create_text_scorer
from app.queues import RabbitMQBroker
from app.repository import get_incident, list_alerts, list_incidents, update_incident
from app.schemas import (
    AlertListResponse,
    AnalyzeTextRequest,
    AnalyzeTextResponse,
    IncidentListResponse,
    IncidentRead,
    IncidentUpdateRequest,
    InferenceTask,
)
from app.services.moderation import process_text_direct

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.pipeline_mode == "queue" and not hasattr(app.state, "broker"):
        app.state.broker = RabbitMQBroker(settings)
    if settings.pipeline_mode == "direct" and not hasattr(app.state, "scorer"):
        app.state.scorer = create_text_scorer(settings)
    try:
        yield
    finally:
        broker: RabbitMQBroker | None = getattr(app.state, "broker", None)
        if broker:
            await broker.close()


app = FastAPI(title="Cybully Moderation API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "pipeline_mode": settings.pipeline_mode,
        "scorer_provider": settings.scorer_provider,
    }


@app.post(
    "/api/v1/analyze/text",
    response_model=AnalyzeTextResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def analyze_text(
    request: Request,
    payload: AnalyzeTextRequest,
    session: AsyncSession = Depends(get_session),
    auth: AuthContext = Depends(require_internal_token),
) -> AnalyzeTextResponse:
    incident_id = str(uuid4())
    task_payload = payload.model_dump()
    if auth.auth_mode == "supabase":
        # With Supabase auth, do not trust caller-supplied user_id.
        task_payload["user_id"] = auth.user_id or payload.user_id

    task = InferenceTask(incident_id=incident_id, **task_payload)

    if settings.pipeline_mode == "direct":
        scorer = getattr(request.app.state, "scorer", create_text_scorer(settings))
        try:
            await process_text_direct(
                task=task,
                session=session,
                settings=settings,
                scorer=scorer,
            )
        except Exception as exc:
            logger.exception("Direct moderation processing failed for incident %s", incident_id)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Direct moderation processing failed.",
            ) from exc
        return AnalyzeTextResponse(tracking_id=incident_id)

    broker: RabbitMQBroker = request.app.state.broker
    try:
        await broker.publish_json(settings.inference_task_queue, task.model_dump(mode="json"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inference queue is unavailable.",
        ) from exc
    return AnalyzeTextResponse(tracking_id=incident_id)


@app.get(
    "/api/v1/incidents",
    response_model=IncidentListResponse,
)
async def get_incidents(
    _auth: AuthContext = Depends(require_moderator_token),
    session: AsyncSession = Depends(get_session),
    severity: str | None = Query(default=None, pattern="^(low|medium|high)$"),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> IncidentListResponse:
    items, total = await list_incidents(
        session,
        severity=severity,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    return IncidentListResponse(items=[IncidentRead.model_validate(item) for item in items], total=total, limit=limit, offset=offset)


@app.get(
    "/api/v1/incidents/{incident_id}",
    response_model=IncidentRead,
)
async def get_incident_detail(
    incident_id: str,
    _auth: AuthContext = Depends(require_moderator_token),
    session: AsyncSession = Depends(get_session),
) -> IncidentRead:
    incident = await get_incident(session, incident_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")
    return IncidentRead.model_validate(incident)


@app.patch(
    "/api/v1/incidents/{incident_id}",
    response_model=IncidentRead,
)
async def patch_incident(
    incident_id: str,
    payload: IncidentUpdateRequest,
    auth: AuthContext = Depends(require_moderator_token),
    session: AsyncSession = Depends(get_session),
) -> IncidentRead:
    incident = await get_incident(session, incident_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")
    updated = await update_incident(
        session,
        incident,
        payload,
        reviewer_user_id=auth.user_id,
        reviewer_email=auth.email,
    )
    return IncidentRead.model_validate(updated)


@app.get(
    "/api/v1/alerts",
    response_model=AlertListResponse,
)
async def get_alerts(
    _auth: AuthContext = Depends(require_moderator_token),
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> AlertListResponse:
    items, total = await list_alerts(session, limit=limit, offset=offset)
    return AlertListResponse(items=items, total=total, limit=limit, offset=offset)
