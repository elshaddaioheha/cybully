from app.core.config import Settings
from app.schemas import ModelScores
from app.severity import calculate_severity, repetition_score


def test_repetition_score_stays_bounded() -> None:
    assert repetition_score(0, 0.7) == 0.0
    assert 0.0 < repetition_score(1, 0.7) < 1.0
    assert repetition_score(100, 0.7) <= 1.0


def test_calculate_severity_maps_high_identity_attack() -> None:
    settings = Settings()
    scores = ModelScores(toxic=0.85, insult=0.9, identity_attack=0.95)

    result = calculate_severity(scores, prior_incident_count=2, settings=settings)

    assert result.severity_level == "high"
    assert result.aggression_score == 0.9
    assert result.intent_score == 0.95


def test_calculate_severity_keeps_benign_text_low() -> None:
    settings = Settings()
    scores = ModelScores(toxic=0.05, insult=0.02, identity_attack=0.0)

    result = calculate_severity(scores, prior_incident_count=0, settings=settings)

    assert result.severity_level == "low"
    assert result.severity_score < settings.risk_threshold_medium


def test_calculate_severity_flags_direct_threat_as_high() -> None:
    settings = Settings()
    scores = ModelScores(
        toxic=0.86,
        severe_toxicity=0.9,
        threat=0.92,
        insult=0.6,
        identity_attack=0.1,
    )

    result = calculate_severity(scores, prior_incident_count=0, settings=settings)

    assert result.intent_score == 1.0
    assert result.severity_level == "high"
