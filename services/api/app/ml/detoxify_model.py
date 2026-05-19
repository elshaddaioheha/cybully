from __future__ import annotations

from app.core.config import Settings
from app.schemas import ModelScores


class DetoxifyScorer:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model_name = settings.detoxify_model_name
        self.model_version = f"detoxify:{settings.detoxify_model_name}"
        self._model = None

    def _load_model(self):
        if self._model is None:
            from detoxify import Detoxify

            self._model = Detoxify(self.settings.detoxify_model_name, device=self.settings.model_inference_device)
        return self._model

    def predict(self, text: str) -> ModelScores:
        raw = self._load_model().predict(text)
        return ModelScores(
            toxic=float(raw.get("toxicity", raw.get("toxic", 0.0))),
            severe_toxicity=float(raw.get("severe_toxicity", 0.0)),
            obscene=float(raw.get("obscene", 0.0)),
            threat=float(raw.get("threat", 0.0)),
            insult=float(raw.get("insult", 0.0)),
            identity_attack=float(raw.get("identity_attack", 0.0)),
        )

