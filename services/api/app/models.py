from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def new_id() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    target_user_id: Mapped[str] = mapped_column(String(255), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="queued", index=True)
    severity_level: Mapped[str] = mapped_column(String(32), index=True)
    severity_score: Mapped[float] = mapped_column(Float, index=True)
    aggression_score: Mapped[float] = mapped_column(Float)
    intent_score: Mapped[float] = mapped_column(Float)
    repetition_score: Mapped[float] = mapped_column(Float)
    toxic_score: Mapped[float] = mapped_column(Float)
    insult_score: Mapped[float] = mapped_column(Float)
    identity_attack_score: Mapped[float] = mapped_column(Float)
    model_name: Mapped[str] = mapped_column(String(128))
    model_version: Mapped[str] = mapped_column(String(128))
    raw_model_output: Mapped[dict] = mapped_column(JSONB)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    incident_id: Mapped[str] = mapped_column(String(36), index=True)
    severity_score: Mapped[float] = mapped_column(Float)
    recipient: Mapped[str] = mapped_column(String(255))
    payload: Mapped[dict] = mapped_column(JSONB)
    delivery_state: Mapped[str] = mapped_column(String(32), default="stubbed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

