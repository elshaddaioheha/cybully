from __future__ import annotations

from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import require_internal_token
from app.db import get_session
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

settings = get_settings()
app = FastAPI(title="Cybully Moderation API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    if not hasattr(app.state, "broker"):
        app.state.broker = RabbitMQBroker(settings)


@app.on_event("shutdown")
async def shutdown() -> None:
    broker: RabbitMQBroker | None = getattr(app.state, "broker", None)
    if broker:
        await broker.close()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}


@app.post(
    "/api/v1/analyze/text",
    response_model=AnalyzeTextResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_internal_token)],
)
async def analyze_text(request: Request, payload: AnalyzeTextRequest) -> AnalyzeTextResponse:
    incident_id = str(uuid4())
    task = InferenceTask(incident_id=incident_id, **payload.model_dump())
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
    dependencies=[Depends(require_internal_token)],
)
async def get_incidents(
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
    dependencies=[Depends(require_internal_token)],
)
async def get_incident_detail(
    incident_id: str,
    session: AsyncSession = Depends(get_session),
) -> IncidentRead:
    incident = await get_incident(session, incident_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")
    return IncidentRead.model_validate(incident)


@app.patch(
    "/api/v1/incidents/{incident_id}",
    response_model=IncidentRead,
    dependencies=[Depends(require_internal_token)],
)
async def patch_incident(
    incident_id: str,
    payload: IncidentUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> IncidentRead:
    incident = await get_incident(session, incident_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")
    updated = await update_incident(session, incident, payload)
    return IncidentRead.model_validate(updated)


@app.get(
    "/api/v1/alerts",
    response_model=AlertListResponse,
    dependencies=[Depends(require_internal_token)],
)
async def get_alerts(
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> AlertListResponse:
    items, total = await list_alerts(session, limit=limit, offset=offset)
    return AlertListResponse(items=items, total=total, limit=limit, offset=offset)
