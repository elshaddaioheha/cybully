from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.ml.factory import TextScorer
from app.repository import count_recent_prior_incidents, create_alert, create_incident
from app.schemas import AlertEvent, InferenceTask, PersistenceEvent
from app.severity import calculate_severity


async def build_moderation_events(
    *,
    task: InferenceTask,
    session: AsyncSession,
    settings: Settings,
    scorer: TextScorer,
) -> tuple[PersistenceEvent, AlertEvent | None]:
    scores = scorer.predict(task.text)
    prior_count = await count_recent_prior_incidents(
        session,
        user_id=task.user_id,
        target_user_id=task.target_user_id,
        window_hours=settings.repetition_window_hours,
        before=task.timestamp,
    )
    severity = calculate_severity(scores, prior_count, settings)
    raw_scores = scores.model_dump()

    persistence_event = PersistenceEvent(
        incident_id=task.incident_id,
        user_id=task.user_id,
        target_user_id=task.target_user_id,
        timestamp=task.timestamp,
        text=task.text,
        severity_level=severity.severity_level,
        severity_score=severity.severity_score,
        aggression_score=severity.aggression_score,
        intent_score=severity.intent_score,
        repetition_score=severity.repetition_score,
        toxic_score=scores.toxic,
        insult_score=scores.insult,
        identity_attack_score=scores.identity_attack,
        model_name=scorer.model_name,
        model_version=scorer.model_version,
        raw_model_output={**raw_scores, "prior_incident_count": prior_count},
    )

    alert_event = None
    if severity.severity_level == "high":
        alert_event = AlertEvent(
            incident_id=task.incident_id,
            severity_score=severity.severity_score,
            recipient=settings.admin_notification_email,
            payload={
                "user_id": task.user_id,
                "target_user_id": task.target_user_id,
                "text": task.text,
                "severity": severity.model_dump(),
                "delivery": "stubbed",
            },
        )

    return persistence_event, alert_event


async def process_text_direct(
    *,
    task: InferenceTask,
    session: AsyncSession,
    settings: Settings,
    scorer: TextScorer,
) -> PersistenceEvent:
    persistence_event, alert_event = await build_moderation_events(
        task=task,
        session=session,
        settings=settings,
        scorer=scorer,
    )
    await create_incident(session, persistence_event)
    if alert_event:
        await create_alert(session, alert_event)
    return persistence_event

