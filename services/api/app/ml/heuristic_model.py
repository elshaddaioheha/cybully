from __future__ import annotations

import re

from app.schemas import ModelScores


class HeuristicScorer:
    model_name = "heuristic"
    model_version = "heuristic:v2"

    _insult_terms = {
        "animal",
        "awful",
        "bastard",
        "crazy",
        "dumb",
        "fool",
        "garbage",
        "idiot",
        "loser",
        "mad",
        "mumu",
        "scum",
        "stupid",
        "trash",
        "useless",
        "worthless",
    }
    _severe_insult_terms = {
        "bitch",
        "die",
        "fucking",
        "moron",
        "nonsense",
        "retard",
        "shit",
    }
    _threat_terms = {
        "attack",
        "beat",
        "burn",
        "destroy",
        "die",
        "hurt",
        "kill",
        "murder",
        "shoot",
        "stab",
        "threat",
        "violence",
    }
    _identity_terms = {
        "african",
        "black",
        "christian",
        "ethnicity",
        "gender",
        "gay",
        "hausa",
        "igbo",
        "lesbian",
        "muslim",
        "queer",
        "race",
        "religion",
        "tribe",
        "yoruba",
    }
    _directed_harassment_patterns = (
        re.compile(r"\byou(?:\s+are|'re)?\s+(?:so\s+)?(?:an?\s+)?[a-z']{2,20}"),
        re.compile(r"\b(?:shut\s+up|nobody\s+likes\s+you)\b"),
    )
    _directed_threat_patterns = (
        re.compile(r"\b(?:i|we)\s+(?:will|'ll)\s+(?:hurt|kill|destroy|beat|stab|shoot)\b"),
        re.compile(r"\b(?:hurt|kill|destroy|beat|stab|shoot)\s+you\b"),
        re.compile(r"\bgo\s+die\b"),
    )

    def _identity_attack_context(
        self,
        tokens: list[str],
        *,
        has_insult: bool,
        has_threat: bool,
    ) -> bool:
        if not tokens:
            return False
        identity_positions = [index for index, token in enumerate(tokens) if token in self._identity_terms]
        if not identity_positions or not (has_insult or has_threat):
            return False

        abusive_terms = self._insult_terms | self._severe_insult_terms | self._threat_terms
        for position in identity_positions:
            window_start = max(0, position - 3)
            window_end = min(len(tokens), position + 4)
            if any(token in abusive_terms for token in tokens[window_start:window_end]):
                return True
        return False

    def _contains_pattern(self, text: str, patterns: tuple[re.Pattern[str], ...]) -> bool:
        return any(pattern.search(text) for pattern in patterns)

    def _score_insult(self, insult_hits: int, severe_insult_hits: int, directed_harassment: bool) -> float:
        score = insult_hits * 0.23 + severe_insult_hits * 0.17
        if insult_hits >= 3:
            score += 0.2
        if directed_harassment and insult_hits:
            score += 0.25
        return min(1.0, score)

    def _score_threat(self, threat_hits: int, directed_threat: bool, token_set: set[str]) -> float:
        score = threat_hits * 0.28
        if directed_threat:
            score += 0.45
        if threat_hits and "you" in token_set:
            score += 0.2
        return min(1.0, score)

    def _score_identity_attack(
        self,
        identity_hits: int,
        insult_hits: int,
        threat_hits: int,
        identity_context: bool,
    ) -> float:
        score = identity_hits * 0.22
        if identity_context:
            score += 0.45
        if identity_hits and (insult_hits or threat_hits):
            score += 0.2
        return min(1.0, score)

    def _score_toxicity(
        self,
        *,
        insult: float,
        threat: float,
        identity_attack: float,
        severity_hits: int,
        directed_harassment: bool,
        directed_threat: bool,
    ) -> float:
        score = max(insult, threat, identity_attack)
        score += 0.06 * min(5, severity_hits)
        if directed_harassment:
            score += 0.1
        if directed_threat:
            score += 0.15
        return min(1.0, score)

    def _score_severe_toxicity(self, toxic: float, threat: float, directed_threat: bool) -> float:
        baseline = max(threat, max(0.0, toxic - 0.2))
        if directed_threat:
            baseline = max(baseline, 0.72)
        return min(1.0, baseline)

    def _score_obscene(self, severe_insult_hits: int, directed_harassment: bool) -> float:
        score = severe_insult_hits * 0.25
        if directed_harassment and severe_insult_hits:
            score += 0.1
        return min(1.0, score)

    def predict(self, text: str) -> ModelScores:
        normalized = text.lower()
        tokens = re.findall(r"[a-zA-Z']+", normalized)
        token_set = set(tokens)

        insult_hits = len(token_set & self._insult_terms)
        severe_insult_hits = len(token_set & self._severe_insult_terms)
        threat_hits = len(token_set & self._threat_terms)
        identity_hits = len(token_set & self._identity_terms)

        directed_harassment = self._contains_pattern(normalized, self._directed_harassment_patterns)
        directed_threat = self._contains_pattern(normalized, self._directed_threat_patterns)
        identity_context = self._identity_attack_context(
            tokens,
            has_insult=(insult_hits + severe_insult_hits) > 0,
            has_threat=threat_hits > 0,
        )

        insult = self._score_insult(insult_hits, severe_insult_hits, directed_harassment)
        threat = self._score_threat(threat_hits, directed_threat, token_set)
        identity_attack = self._score_identity_attack(identity_hits, insult_hits, threat_hits, identity_context)
        severity_hits = insult_hits + severe_insult_hits + threat_hits + identity_hits
        toxic = self._score_toxicity(
            insult=insult,
            threat=threat,
            identity_attack=identity_attack,
            severity_hits=severity_hits,
            directed_harassment=directed_harassment,
            directed_threat=directed_threat,
        )
        severe_toxicity = self._score_severe_toxicity(toxic=toxic, threat=threat, directed_threat=directed_threat)
        obscene = self._score_obscene(severe_insult_hits=severe_insult_hits, directed_harassment=directed_harassment)

        return ModelScores(
            toxic=round(toxic, 4),
            severe_toxicity=round(severe_toxicity, 4),
            obscene=round(obscene, 4),
            threat=round(threat, 4),
            insult=round(insult, 4),
            identity_attack=round(identity_attack, 4),
        )
