from __future__ import annotations

import math

from app.core.config import Settings
from app.schemas import ModelScores, SeverityResult


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def repetition_score(prior_incident_count: int, decay: float) -> float:
    if prior_incident_count <= 0:
        return 0.0
    return clamp(1.0 - math.exp(-decay * prior_incident_count))


def aggression_score(scores: ModelScores) -> float:
    return clamp(
        max(
            scores.toxic,
            scores.severe_toxicity,
            scores.obscene,
            scores.threat,
            scores.insult,
        )
    )


def severity_level(score: float, settings: Settings) -> str:
    if score >= settings.risk_threshold_high:
        return "high"
    if score >= settings.risk_threshold_medium:
        return "medium"
    return "low"


def calculate_severity(
    scores: ModelScores,
    prior_incident_count: int,
    settings: Settings,
) -> SeverityResult:
    total = settings.risk_weight_total or 1.0
    intent = clamp(max(scores.identity_attack, scores.threat, scores.severe_toxicity))
    if scores.threat >= 0.8:
        intent = clamp(max(intent, scores.threat + 0.1))
    repetition = repetition_score(prior_incident_count, settings.repetition_decay)
    aggression = aggression_score(scores)
    weighted = (
        intent * settings.risk_weight_intent
        + repetition * settings.risk_weight_repetition
        + aggression * settings.risk_weight_aggression
    ) / total
    final_score = clamp(weighted)

    return SeverityResult(
        severity_score=round(final_score, 4),
        severity_level=severity_level(final_score, settings),  # type: ignore[arg-type]
        aggression_score=round(aggression, 4),
        intent_score=round(intent, 4),
        repetition_score=round(repetition, 4),
        prior_incident_count=prior_incident_count,
    )
