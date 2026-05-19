from __future__ import annotations

import asyncio
import logging

from app.core.config import get_settings
from app.db import AsyncSessionLocal
from app.queues import RabbitMQBroker
from app.repository import create_incident
from app.schemas import PersistenceEvent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cybully.persistence_worker")


async def main() -> None:
    settings = get_settings()
    broker = RabbitMQBroker(settings)

    async def handle(payload: dict) -> None:
        event = PersistenceEvent.model_validate(payload)
        async with AsyncSessionLocal() as session:
            await create_incident(session, event)
        logger.info("Persisted incident %s", event.incident_id)

    await broker.consume_json(settings.persistence_queue, handle)
    logger.info("Persistence worker consuming %s", settings.persistence_queue)
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())

