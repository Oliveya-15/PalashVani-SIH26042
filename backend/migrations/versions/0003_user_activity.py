"""add user_activity table

Revision ID: 0003
Revises: d708ba7fd472
Create Date: 2026-09-28

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003'
down_revision = 'd708ba7fd472'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if not inspector.has_table("user_activity"):
        op.create_table(
            'user_activity',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('action', sa.String(length=60), nullable=False),
            sa.Column('entity_type', sa.String(length=40), nullable=False),
            sa.Column('entity_id', sa.Integer(), nullable=True),
            sa.Column('detail', sa.Text(), nullable=False, server_default=''),
            sa.Column('ip_address', sa.String(length=45), nullable=False, server_default=''),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    op.drop_table('user_activity')