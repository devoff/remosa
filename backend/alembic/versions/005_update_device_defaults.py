"""update device defaults

Revision ID: 005
Revises: 004
Create Date: 2024-05-28 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None

def upgrade():
    # Обновляем значение по умолчанию для status
    op.alter_column('devices', 'status',
                    server_default='OFFLINE',
                    existing_type=sa.Enum('ONLINE', 'WARNING', 'OFFLINE', name='devicestatus'),
                    existing_nullable=False)

def downgrade():
    # Возвращаем предыдущее значение по умолчанию
    op.alter_column('devices', 'status',
                    server_default=None,
                    existing_type=sa.Enum('ONLINE', 'WARNING', 'OFFLINE', name='devicestatus'),
                    existing_nullable=False) 