from __future__ import annotations

import json
from collections.abc import Awaitable, Callable

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from app.core.config import Settings

MessageHandler = Callable[[dict], Awaitable[None]]


class RabbitMQBroker:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._connection: aio_pika.RobustConnection | None = None
        self._channel: aio_pika.RobustChannel | None = None

    async def connect(self) -> aio_pika.RobustChannel:
        if self._channel and not self._channel.is_closed:
            return self._channel

        self._connection = await aio_pika.connect_robust(self.settings.rabbitmq_url)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=8)
        for queue_name in (
            self.settings.inference_task_queue,
            self.settings.persistence_queue,
            self.settings.alert_dispatch_queue,
        ):
            await self._channel.declare_queue(queue_name, durable=True)
        return self._channel

    async def publish_json(self, queue_name: str, payload: dict) -> None:
        channel = await self.connect()
        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload, default=str).encode("utf-8"),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=queue_name,
        )

    async def consume_json(self, queue_name: str, handler: MessageHandler) -> None:
        channel = await self.connect()
        queue = await channel.declare_queue(queue_name, durable=True)

        async def wrapped(message: AbstractIncomingMessage) -> None:
            async with message.process(requeue=False):
                payload = json.loads(message.body.decode("utf-8"))
                await handler(payload)

        await queue.consume(wrapped)

    async def close(self) -> None:
        if self._connection:
            await self._connection.close()

