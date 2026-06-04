"""webhook_configs table

Revision ID: 002_webhook_config
Revises: 001_initial
Create Date: 2026-01-02
"""
from alembic import op
import sqlalchemy as sa

revision = "002_webhook_config"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "webhook_configs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("location_id", sa.String(36), sa.ForeignKey("locations.id")),
        sa.Column("provider", sa.String(20)),
        sa.Column("endpoint_url", sa.String(500)),
        sa.Column("secret_key", sa.String(128)),
        sa.Column("is_active", sa.Boolean, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_webhook_location", "webhook_configs", ["location_id"])


def downgrade() -> None:
    op.drop_table("webhook_configs")
