from __future__ import annotations

import re

from app.schemas import ModelScores


class HeuristicScorer:
    model_name = "heuristic"
    model_version = "heuristic:v1"

    _insult_terms = {
        "awful",
        "fool",
        "idiot",
        "mumu",
        "stupid",
        "useless",
        "worthless",
    }
    _threat_terms = {
        "destroy",
        "hurt",
        "kill",
        "threat",
        "violence",
    }
    _identity_terms = {
        "gender",
        "gay",
        "igbo",
        "race",
        "religion",
        "tribe",
        "yoruba",
        "hausa",
    }

    def predict(self, text: str) -> ModelScores:
        tokens = set(re.findall(r"[a-zA-Z']+", text.lower()))
        insult_hits = len(tokens & self._insult_terms)
        threat_hits = len(tokens & self._threat_terms)
        identity_hits = len(tokens & self._identity_terms)

        insult = min(1.0, insult_hits * 0.35)
        threat = min(1.0, threat_hits * 0.45)
        identity_attack = min(1.0, identity_hits * 0.5 + (0.25 if insult_hits else 0.0))
        toxic = min(1.0, max(insult, threat, identity_attack) + 0.2 * min(1, insult_hits + threat_hits))

        return ModelScores(
            toxic=round(toxic, 4),
            severe_toxicity=round(max(threat, toxic - 0.25), 4),
            obscene=0.0,
            threat=round(threat, 4),
            insult=round(insult, 4),
            identity_attack=round(identity_attack, 4),
        )

