from app.core.config import Settings
from app.ml import factory
from app.ml.factory import FallbackScorer
from app.ml.heuristic_model import HeuristicScorer
from app.schemas import ModelScores


class FailingScorer:
    model_name = "failing"
    model_version = "failing:v1"

    def __init__(self) -> None:
        self.calls = 0

    def predict(self, text: str) -> ModelScores:
        self.calls += 1
        raise RuntimeError("boom")


class WorkingScorer:
    model_name = "working"
    model_version = "working:v1"

    def predict(self, text: str) -> ModelScores:
        return ModelScores(toxic=0.12)


def test_auto_provider_without_detoxify_uses_heuristic(monkeypatch) -> None:
    settings = Settings(scorer_provider="auto")
    monkeypatch.setattr(factory, "_detoxify_dependency_available", lambda: False)

    scorer = factory.create_text_scorer(settings)

    assert isinstance(scorer, HeuristicScorer)


def test_fallback_scorer_stops_retrying_primary_after_failure() -> None:
    primary = FailingScorer()
    scorer = FallbackScorer(primary=primary, fallback=WorkingScorer())

    first = scorer.predict("first")
    second = scorer.predict("second")

    assert first.toxic == 0.12
    assert second.toxic == 0.12
    assert primary.calls == 1
