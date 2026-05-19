from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app import main
from app.core import security
from app.core.config import get_settings
from app.main import app
from app.ml.heuristic_model import HeuristicScorer


class FakeBroker:
    def __init__(self) -> None:
        self.messages: list[tuple[str, dict]] = []

    async def publish_json(self, queue_name: str, payload: dict) -> None:
        self.messages.append((queue_name, payload))


def test_analyze_text_publishes_inference_task(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(main.settings, "pipeline_mode", "queue")
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


def test_analyze_text_direct_mode_processes_without_broker(monkeypatch) -> None:
    calls = []

    async def fake_process_text_direct(**kwargs):
        calls.append(kwargs)

    monkeypatch.setattr(main.settings, "pipeline_mode", "direct")
    monkeypatch.setattr(main, "process_text_direct", fake_process_text_direct)
    app.state.scorer = HeuristicScorer()
    client = TestClient(app)

    response = client.post(
        "/api/v1/analyze/text",
        headers={"X-Internal-Token": main.settings.backend_internal_token},
        json={
            "user_id": "author@example.com",
            "target_user_id": "target@example.com",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "text": "You are awful",
        },
    )

    assert response.status_code == 202
    assert response.json()["tracking_id"]
    assert calls


def test_analyze_text_accepts_supabase_bearer(monkeypatch) -> None:
    calls = []

    async def fake_process_text_direct(**kwargs):
        calls.append(kwargs)

    async def fake_fetch_supabase_user(token: str, apikey: str):
        assert token == "token-123"
        assert apikey == "publishable-key"
        return {"id": "user-uuid-1", "email": "user@example.com"}

    monkeypatch.setattr(main.settings, "pipeline_mode", "direct")
    monkeypatch.setattr(main.settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(main.settings, "supabase_publishable_key", "publishable-key")
    monkeypatch.setattr(main.settings, "backend_internal_token", "dev-internal-token")
    monkeypatch.setattr(main, "process_text_direct", fake_process_text_direct)
    monkeypatch.setattr(security, "_fetch_supabase_user", fake_fetch_supabase_user)
    app.state.scorer = HeuristicScorer()
    client = TestClient(app)

    response = client.post(
        "/api/v1/analyze/text",
        headers={"Authorization": "Bearer token-123"},
        json={
            "user_id": "spoofed@example.com",
            "target_user_id": "target@example.com",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "text": "You are awful",
        },
    )

    assert response.status_code == 202
    assert calls
    task = calls[0]["task"]
    assert task.user_id == "user-uuid-1"
