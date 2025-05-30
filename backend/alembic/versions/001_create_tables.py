"""create tables

Revision ID: 001
Revises: 
Create Date: 2024-05-28 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create devices table
    op.create_table(
        'devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create logs table
    op.create_table(
        'logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('logs')
    op.drop_table('clients')
    op.drop_table('devices') 