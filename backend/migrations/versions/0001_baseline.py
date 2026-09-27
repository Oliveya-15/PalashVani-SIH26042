"""baseline -- schema as already deployed (no-op)

This migration deliberately does NOT create any tables. Your database
already has all of these tables (languages, curriculum_grades/subjects/
chapters, translation_entries, translation_history, feedback,
dataset_metadata, and users) because they were created by
Base.metadata.create_all() the very first time the app started -- long
before this project used Alembic at all.

This migration's only job is to give Alembic a starting point ("revision
0001") to record as your database's current state, via `alembic stamp`
(a command that marks a revision as applied WITHOUT running any SQL) --
see SETUP_INSTRUCTIONS.md step 3. From here on, all *new* schema changes
(like migration 0002, right after this one) go through real, trackable
Alembic migrations instead of silently depending on create_all() again.

Revision ID: 0001
Revises:
Create Date: (baseline)
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass  # intentionally empty -- see module docstring


def downgrade() -> None:
    pass
