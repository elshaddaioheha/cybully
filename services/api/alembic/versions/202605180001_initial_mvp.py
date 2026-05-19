"""initial mvp schema

Revision ID: 202605180001
Revises:
Create Date: 2026-05-18 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "202605180001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "incidents",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=255), nullable=False, index=True),
        sa.Column("target_user_id", sa.String(length=255), nullable=False, index=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued", index=True),
        sa.Column("severity_level", sa.String(length=32), nullable=False, index=True),
        sa.Column("severity_score", sa.Float(), nullable=False, index=True),
        sa.Column("aggression_score", sa.Float(), nullable=False),
        sa.Column("intent_score", sa.Float(), nullable=False),
        sa.Column("repetition_score", sa.Float(), nullable=False),
        sa.Column("toxic_score", sa.Float(), nullable=False),
        sa.Column("insult_score", sa.Float(), nullable=False),
        sa.Column("identity_attack_score", sa.Float(), nullable=False),
        sa.Column("model_name", sa.String(length=128), nullable=False),
        sa.Column("model_version", sa.String(length=128), nullable=False),
        sa.Column("raw_model_output", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_incidents_user_target_timestamp", "incidents", ["user_id", "target_user_id", "timestamp"])

    op.create_table(
        "alerts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("incident_id", sa.String(length=36), nullable=False, index=True),
        sa.Column("severity_score", sa.Float(), nullable=False),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("delivery_state", sa.String(length=32), nullable=False, server_default="stubbed"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("alerts")
    op.drop_index("ix_incidents_user_target_timestamp", table_name="incidents")
    op.drop_table("incidents")

