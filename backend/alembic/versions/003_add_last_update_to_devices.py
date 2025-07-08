"""add last_update to devices

Revision ID: 003
Revises: 002
Create Date: 2024-05-28 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

def upgrade():
    # Добавляем колонку last_update
    op.add_column('devices', sa.Column('last_update', sa.DateTime(timezone=True), nullable=True))
    
    # Устанавливаем значение по умолчанию как текущее время для существующих записей
    op.execute("UPDATE devices SET last_update = CURRENT_TIMESTAMP")

def downgrade():
    # Удаляем колонку last_update
    op.drop_column('devices', 'last_update') 