from app.core.config import Settings
from app.ml.heuristic_model import HeuristicScorer
from app.severity import calculate_severity


def test_heuristic_flags_direct_threat_as_high() -> None:
    scorer = HeuristicScorer()

    scores = scorer.predict("I will kill you and destroy you tonight.")
    severity = calculate_severity(scores, prior_incident_count=0, settings=Settings())

    assert scores.threat >= 0.8
    assert scores.severe_toxicity >= 0.7
    assert severity.severity_level == "high"


def test_heuristic_boosts_identity_attack_context() -> None:
    scorer = HeuristicScorer()
    scores = scorer.predict("You useless yoruba idiot.")

    assert scores.identity_attack >= 0.7


def test_heuristic_keeps_benign_text_low() -> None:
    scorer = HeuristicScorer()
    scores = scorer.predict("Thanks for helping me with this project.")
    severity = calculate_severity(scores, prior_incident_count=0, settings=Settings())

    assert scores.toxic < 0.25
    assert severity.severity_level == "low"
