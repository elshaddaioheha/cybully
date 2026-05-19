from __future__ import annotations

import asyncio
import logging

from app.core.config import get_settings
from app.db import AsyncSessionLocal
from app.queues import RabbitMQBroker
from app.repository import create_alert
from app.schemas import AlertEvent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cybully.alert_worker")


async def main() -> None:
    settings = get_settings()
    broker = RabbitMQBroker(settings)

    async def handle(payload: dict) -> None:
        event = AlertEvent.model_validate(payload)
        async with AsyncSessionLocal() as session:
            await create_alert(session, event)
        logger.info(
            "Stubbed alert for incident %s to %s",
            event.incident_id,
            event.recipient,
        )

    await broker.consume_json(settings.alert_dispatch_queue, handle)
    logger.info("Alert worker consuming %s", settings.alert_dispatch_queue)
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())

