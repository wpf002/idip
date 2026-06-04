"""initial schema: locations, scans, state_rules, staff

Revision ID: 001_initial
Revises:
Create Date: 2026-01-01
"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "locations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("address", sa.String(500)),
        sa.Column("city", sa.String(100)),
        sa.Column("state_code", sa.String(2)),
        sa.Column("subscription_tier", sa.String(20), server_default="starter"),
        sa.Column("api_key", sa.String(128), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_locations_api_key", "locations", ["api_key"], unique=True)

    op.create_table(
        "staff",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("location_id", sa.String(36), sa.ForeignKey("locations.id")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("role", sa.String(50), server_default="door"),
        sa.Column("pin_hash", sa.String(128)),
        sa.Column("is_active", sa.Boolean, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "scans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("timestamp", sa.DateTime(timezone=True)),
        sa.Column("hashed_license_number", sa.String(128)),
        sa.Column("state_code", sa.String(2)),
        sa.Column("dob", sa.String(10)),
        sa.Column("age", sa.Integer),
        sa.Column("expiration_date", sa.String(10)),
        sa.Column("risk_score", sa.Integer, server_default="0"),
        sa.Column("result", sa.String(10)),
        sa.Column("flags", sa.JSON),
        sa.Column("document_type", sa.String(40)),
        sa.Column("location_id", sa.String(36), sa.ForeignKey("locations.id")),
        sa.Column("staff_id", sa.String(36), sa.ForeignKey("staff.id")),
        sa.Column("scan_method", sa.String(10), server_default="camera"),
        sa.Column("synced", sa.Boolean, server_default=sa.true()),
        sa.Column("client_timestamp", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_scans_hashed", "scans", ["hashed_license_number"])
    op.create_index("ix_scans_timestamp", "scans", ["timestamp"])
    op.create_index("ix_scans_result", "scans", ["result"])

    op.create_table(
        "state_rules",
        sa.Column("state_code", sa.String(2), primary_key=True),
        sa.Column("state_name", sa.String(50)),
        sa.Column("version", sa.String(10), server_default="1.0"),
        sa.Column("rules", sa.JSON),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table("state_rules")
    op.drop_table("scans")
    op.drop_table("staff")
    op.drop_table("locations")
