"""admin panel -- rights clearance, activity attribution, audit log, users

Adds exactly what the admin panel needs on top of the 0001 baseline:

  - translation_entries.rights_cleared, .rights_note   (copyright gate)
  - feedback.user_id                                     (who submitted it)
  - translation_history.user_id                          (who ran it)
  - users table                                          (if not already
    created by the earlier login/register update -- checked defensively
    below so this migration is safe to run whether or not that update's
    create_all() already made it)
  - audit_log table                                      (admin action log)

Written defensively (checks what already exists before acting) because
different deployments may be at slightly different starting points --
see SETUP_INSTRUCTIONS.md step 3 for exactly when to run this.

Revision ID: 0002
Revises: 0001
Create Date: (admin panel update)
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(name)


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    return any(c["name"] == column for c in sa.inspect(bind).get_columns(table))


def upgrade() -> None:
    # --- users table (create only if the auth update hasn't already made it) ---
    if not _has_table("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("full_name", sa.String(length=120), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column("role", sa.String(length=20), nullable=False, server_default="teacher"),
            sa.Column("school_name", sa.String(length=200), nullable=False, server_default=""),
            sa.Column("district", sa.String(length=100), nullable=False, server_default=""),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- translation_entries: copyright / rights-clearance gate ---
    if not _has_column("translation_entries", "rights_cleared"):
        with op.batch_alter_table("translation_entries") as batch_op:
            batch_op.add_column(
                sa.Column("rights_cleared", sa.Boolean(), nullable=False, server_default=sa.true())
            )
    if not _has_column("translation_entries", "rights_note"):
        with op.batch_alter_table("translation_entries") as batch_op:
            batch_op.add_column(
                sa.Column("rights_note", sa.String(length=300), nullable=False, server_default="")
            )

    # --- feedback: attribute to the submitting user ---
    if not _has_column("feedback", "user_id"):
        with op.batch_alter_table("feedback") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
            batch_op.create_foreign_key("fk_feedback_user_id", "users", ["user_id"], ["id"])

    # --- translation_history: attribute to the requesting user ---
    if not _has_column("translation_history", "user_id"):
        with op.batch_alter_table("translation_history") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
            batch_op.create_foreign_key("fk_translation_history_user_id", "users", ["user_id"], ["id"])

    # --- audit_log: new table for admin action history ---
    if not _has_table("audit_log"):
        op.create_table(
            "audit_log",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("admin_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("action", sa.String(length=60), nullable=False),
            sa.Column("target_type", sa.String(length=40), nullable=False),
            sa.Column("target_id", sa.Integer(), nullable=True),
            sa.Column("details", sa.Text(), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    if _has_table("audit_log"):
        op.drop_table("audit_log")
    if _has_column("translation_history", "user_id"):
        with op.batch_alter_table("translation_history") as batch_op:
            batch_op.drop_constraint("fk_translation_history_user_id", type_="foreignkey")
            batch_op.drop_column("user_id")
    if _has_column("feedback", "user_id"):
        with op.batch_alter_table("feedback") as batch_op:
            batch_op.drop_constraint("fk_feedback_user_id", type_="foreignkey")
            batch_op.drop_column("user_id")
    if _has_column("translation_entries", "rights_note"):
        with op.batch_alter_table("translation_entries") as batch_op:
            batch_op.drop_column("rights_note")
    if _has_column("translation_entries", "rights_cleared"):
        with op.batch_alter_table("translation_entries") as batch_op:
            batch_op.drop_column("rights_cleared")
    # users table is intentionally NOT dropped on downgrade -- it may
    # predate this migration (created by the auth update instead), and
    # dropping it would delete every registered account.