from __future__ import annotations

from typing import Protocol

from app.core.config import Settings
from app.ml.heuristic_model import HeuristicScorer
from app.schemas import ModelScores


class TextScorer(Protocol):
    model_name: str
    model_version: str

    def predict(self, text: str) -> ModelScores:
        ...


def create_text_scorer(settings: Settings) -> TextScorer:
    if settings.scorer_provider == "detoxify":
        from app.ml.detoxify_model import DetoxifyScorer

        return DetoxifyScorer(settings)
    return HeuristicScorer()

