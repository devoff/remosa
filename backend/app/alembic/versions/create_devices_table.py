"""create devices table

Revision ID: create_devices_table
Revises: 
Create Date: 2024-03-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'create_devices_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Создаем enum тип для статуса устройства
    op.execute("CREATE TYPE devicestatus AS ENUM ('online', 'warning', 'offline')")
    
    # Создаем таблицу devices
    op.create_table(
        'devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('online', 'warning', 'offline', name='devicestatus'), nullable=False, server_default='offline'),
        sa.Column('last_update', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('grafana_uid', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('grafana_uid')
    )
    
    # Создаем индекс для быстрого поиска по имени
    op.create_index(op.f('ix_devices_name'), 'devices', ['name'], unique=False)

def downgrade():
    # Удаляем индекс
    op.drop_index(op.f('ix_devices_name'), table_name='devices')
    
    # Удаляем таблицу
    op.drop_table('devices')
    
    # Удаляем enum тип
    op.execute("DROP TYPE devicestatus") 