from __future__ import annotations

import importlib.util
import logging
from typing import Protocol

from app.core.config import Settings
from app.ml.heuristic_model import HeuristicScorer
from app.schemas import ModelScores

logger = logging.getLogger(__name__)


class TextScorer(Protocol):
    model_name: str
    model_version: str

    def predict(self, text: str) -> ModelScores:
        ...


class FallbackScorer:
    def __init__(self, primary: TextScorer, fallback: TextScorer) -> None:
        self._primary = primary
        self._fallback = fallback
        self._primary_failed = False
        self.model_name = f"{primary.model_name}+{fallback.model_name}"
        self.model_version = f"{primary.model_version}+{fallback.model_version}"

    def predict(self, text: str) -> ModelScores:
        if not self._primary_failed:
            try:
                return self._primary.predict(text)
            except Exception:
                self._primary_failed = True
                logger.exception(
                    "Primary scorer failed; falling back to heuristic scorer for subsequent requests."
                )
        return self._fallback.predict(text)


def _detoxify_dependency_available() -> bool:
    return importlib.util.find_spec("detoxify") is not None


def create_text_scorer(settings: Settings) -> TextScorer:
    if settings.scorer_provider == "heuristic":
        return HeuristicScorer()

    if settings.scorer_provider == "detoxify":
        from app.ml.detoxify_model import DetoxifyScorer

        return DetoxifyScorer(settings)

    if _detoxify_dependency_available():
        from app.ml.detoxify_model import DetoxifyScorer

        return FallbackScorer(DetoxifyScorer(settings), HeuristicScorer())

    logger.info("Detoxify dependencies not available; using heuristic scorer.")
    return HeuristicScorer()
