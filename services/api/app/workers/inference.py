from __future__ import annotations

import asyncio
import logging

from app.core.config import get_settings
from app.db import AsyncSessionLocal
from app.ml.factory import create_text_scorer
from app.queues import RabbitMQBroker
from app.schemas import InferenceTask
from app.services.moderation import build_moderation_events

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cybully.inference_worker")


async def main() -> None:
    settings = get_settings()
    broker = RabbitMQBroker(settings)
    scorer = create_text_scorer(settings)

    async def handle(payload: dict) -> None:
        task = InferenceTask.model_validate(payload)
        async with AsyncSessionLocal() as session:
            persistence_event, alert_event = await build_moderation_events(
                task=task,
                session=session,
                settings=settings,
                scorer=scorer,
            )
        await broker.publish_json(settings.persistence_queue, persistence_event.model_dump(mode="json"))
        if alert_event:
            await broker.publish_json(settings.alert_dispatch_queue, alert_event.model_dump(mode="json"))

        logger.info("Analyzed incident %s as %s", task.incident_id, persistence_event.severity_level)

    await broker.consume_json(settings.inference_task_queue, handle)
    logger.info("Inference worker consuming %s", settings.inference_task_queue)
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
