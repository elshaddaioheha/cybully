from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


class FakeBroker:
    def __init__(self) -> None:
        self.messages: list[tuple[str, dict]] = []

    async def publish_json(self, queue_name: str, payload: dict) -> None:
        self.messages.append((queue_name, payload))


def test_analyze_text_publishes_inference_task() -> None:
    settings = get_settings()
    fake_broker = FakeBroker()
    app.state.broker = fake_broker
    client = TestClient(app)

    response = client.post(
        "/api/v1/analyze/text",
        headers={"X-Internal-Token": settings.backend_internal_token},
        json={
            "user_id": "author@example.com",
            "target_user_id": "target@example.com",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "text": "You are awful",
        },
    )

    assert response.status_code == 202
    assert response.json()["tracking_id"]
    assert fake_broker.messages[0][0] == settings.inference_task_queue

