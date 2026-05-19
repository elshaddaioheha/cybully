from __future__ import annotations

import asyncio
import logging

from app.core.config import get_settings
from app.db import AsyncSessionLocal
from app.ml.detoxify_model import DetoxifyScorer
from app.queues import RabbitMQBroker
from app.repository import count_recent_prior_incidents
from app.schemas import AlertEvent, InferenceTask, PersistenceEvent
from app.severity import calculate_severity

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cybully.inference_worker")


async def main() -> None:
    settings = get_settings()
    broker = RabbitMQBroker(settings)
    scorer = DetoxifyScorer(settings)

    async def handle(payload: dict) -> None:
        task = InferenceTask.model_validate(payload)
        scores = scorer.predict(task.text)
        async with AsyncSessionLocal() as session:
            prior_count = await count_recent_prior_incidents(
                session,
                user_id=task.user_id,
                target_user_id=task.target_user_id,
                window_hours=settings.repetition_window_hours,
                before=task.timestamp,
            )

        severity = calculate_severity(scores, prior_count, settings)
        raw_scores = scores.model_dump()
        event = PersistenceEvent(
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
        await broker.publish_json(settings.persistence_queue, event.model_dump(mode="json"))

        if severity.severity_level == "high":
            alert = AlertEvent(
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
            await broker.publish_json(settings.alert_dispatch_queue, alert.model_dump(mode="json"))

        logger.info("Analyzed incident %s as %s", task.incident_id, severity.severity_level)

    await broker.consume_json(settings.inference_task_queue, handle)
    logger.info("Inference worker consuming %s", settings.inference_task_queue)
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())

