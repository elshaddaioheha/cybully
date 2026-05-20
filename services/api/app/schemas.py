from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


IncidentStatus = Literal["queued", "analyzed", "reviewed", "dismissed", "escalated"]
SeverityLevel = Literal["low", "medium", "high"]


class AnalyzeTextRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=255)
    target_user_id: str = Field(min_length=1, max_length=255)
    timestamp: datetime
    text: str = Field(min_length=1, max_length=5000)


class AnalyzeTextResponse(BaseModel):
    tracking_id: str
    status: Literal["accepted"] = "accepted"


class InferenceTask(AnalyzeTextRequest):
    incident_id: str


class ModelScores(BaseModel):
    toxic: float = 0.0
    severe_toxicity: float = 0.0
    obscene: float = 0.0
    threat: float = 0.0
    insult: float = 0.0
    identity_attack: float = 0.0


class SeverityResult(BaseModel):
    severity_score: float
    severity_level: SeverityLevel
    aggression_score: float
    intent_score: float
    repetition_score: float
    prior_incident_count: int


class PersistenceEvent(BaseModel):
    incident_id: str
    user_id: str
    target_user_id: str
    timestamp: datetime
    text: str
    status: Literal["analyzed"] = "analyzed"
    severity_level: SeverityLevel
    severity_score: float
    aggression_score: float
    intent_score: float
    repetition_score: float
    toxic_score: float
    insult_score: float
    identity_attack_score: float
    model_name: str
    model_version: str
    raw_model_output: dict


class AlertEvent(BaseModel):
    incident_id: str
    severity_score: float
    recipient: str
    payload: dict


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    target_user_id: str
    timestamp: datetime
    text: str
    status: str
    severity_level: str
    severity_score: float
    aggression_score: float
    intent_score: float
    repetition_score: float
    toxic_score: float
    insult_score: float
    identity_attack_score: float
    model_name: str
    model_version: str
    raw_model_output: dict
    review_note: str | None
    reviewed_by_user_id: str | None
    reviewed_by_email: str | None
    moderated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class IncidentListResponse(BaseModel):
    items: list[IncidentRead]
    total: int
    limit: int
    offset: int


class IncidentUpdateRequest(BaseModel):
    status: Literal["reviewed", "dismissed", "escalated"]
    review_note: str | None = Field(default=None, max_length=2000)


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    severity_score: float
    recipient: str
    payload: dict
    delivery_state: str
    created_at: datetime


class AlertListResponse(BaseModel):
    items: list[AlertRead]
    total: int
    limit: int
    offset: int
