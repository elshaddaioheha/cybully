from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Alert, Incident
from app.schemas import AlertEvent, IncidentUpdateRequest, PersistenceEvent


async def create_incident(session: AsyncSession, event: PersistenceEvent) -> Incident:
    incident = Incident(
        id=event.incident_id,
        user_id=event.user_id,
        target_user_id=event.target_user_id,
        timestamp=event.timestamp,
        text=event.text,
        status=event.status,
        severity_level=event.severity_level,
        severity_score=event.severity_score,
        aggression_score=event.aggression_score,
        intent_score=event.intent_score,
        repetition_score=event.repetition_score,
        toxic_score=event.toxic_score,
        insult_score=event.insult_score,
        identity_attack_score=event.identity_attack_score,
        model_name=event.model_name,
        model_version=event.model_version,
        raw_model_output=event.raw_model_output,
    )
    session.add(incident)
    await session.commit()
    await session.refresh(incident)
    return incident


async def create_alert(session: AsyncSession, event: AlertEvent) -> Alert:
    alert = Alert(
        incident_id=event.incident_id,
        severity_score=event.severity_score,
        recipient=event.recipient,
        payload=event.payload,
    )
    session.add(alert)
    await session.commit()
    await session.refresh(alert)
    return alert


def _incident_query(
    *,
    severity: str | None = None,
    status: str | None = None,
) -> Select[tuple[Incident]]:
    query = select(Incident)
    if severity:
        query = query.where(Incident.severity_level == severity)
    if status:
        query = query.where(Incident.status == status)
    return query.order_by(Incident.created_at.desc())


async def list_incidents(
    session: AsyncSession,
    *,
    severity: str | None,
    status: str | None,
    limit: int,
    offset: int,
) -> tuple[list[Incident], int]:
    base_query = _incident_query(severity=severity, status=status)
    count_query = select(func.count()).select_from(base_query.subquery())
    total = int(await session.scalar(count_query) or 0)
    result = await session.execute(base_query.limit(limit).offset(offset))
    return list(result.scalars()), total


async def get_incident(session: AsyncSession, incident_id: str) -> Incident | None:
    return await session.get(Incident, incident_id)


async def update_incident(
    session: AsyncSession,
    incident: Incident,
    update: IncidentUpdateRequest,
    *,
    reviewer_user_id: str | None,
    reviewer_email: str | None,
) -> Incident:
    incident.status = update.status
    incident.review_note = update.review_note
    incident.reviewed_by_user_id = reviewer_user_id
    incident.reviewed_by_email = reviewer_email
    incident.moderated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(incident)
    return incident


async def list_alerts(session: AsyncSession, *, limit: int, offset: int) -> tuple[list[Alert], int]:
    query = select(Alert).order_by(Alert.created_at.desc())
    total = int(await session.scalar(select(func.count()).select_from(query.subquery())) or 0)
    result = await session.execute(query.limit(limit).offset(offset))
    return list(result.scalars()), total


async def count_recent_prior_incidents(
    session: AsyncSession,
    *,
    user_id: str,
    target_user_id: str,
    window_hours: int,
    before: datetime | None = None,
) -> int:
    now = before or datetime.now(timezone.utc)
    window_start = now - timedelta(hours=window_hours)
    count = await session.scalar(
        select(func.count())
        .select_from(Incident)
        .where(Incident.user_id == user_id)
        .where(Incident.target_user_id == target_user_id)
        .where(Incident.timestamp >= window_start)
        .where(Incident.timestamp < now)
        .where(Incident.severity_level.in_(["medium", "high"]))
    )
    return int(count or 0)
