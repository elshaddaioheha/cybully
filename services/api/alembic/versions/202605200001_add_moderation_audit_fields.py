"""add moderation audit fields to incidents

Revision ID: 202605200001
Revises: 202605180001
Create Date: 2026-05-20 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "202605200001"
down_revision = "202605180001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("incidents", sa.Column("reviewed_by_user_id", sa.String(length=255), nullable=True))
    op.add_column("incidents", sa.Column("reviewed_by_email", sa.String(length=255), nullable=True))
    op.add_column("incidents", sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_incidents_moderated_at", "incidents", ["moderated_at"])


def downgrade() -> None:
    op.drop_index("ix_incidents_moderated_at", table_name="incidents")
    op.drop_column("incidents", "moderated_at")
    op.drop_column("incidents", "reviewed_by_email")
    op.drop_column("incidents", "reviewed_by_user_id")
