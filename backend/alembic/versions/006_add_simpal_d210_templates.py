"""create command_templates table

Revision ID: 006
Revises: 005
Create Date: 2024-05-30 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'command_templates',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('device_type', sa.String(50), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('subcategory', sa.String(100), nullable=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('template', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('params_schema', postgresql.JSON, nullable=False)
    )

def downgrade():
    op.drop_table('command_templates')