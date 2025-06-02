"""update alerts table structure

Revision ID: 015
Revises: 013  # Теперь зависит от миграции 013 (изменение extra_data)
Create Date: 2024-07-26 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '015'
down_revision = '014'  # Зависит от 013_change_extra_data_to_jsonb.py
branch_labels = None
depends_on = None


def upgrade():
    # Удаляем создание таблицы alerts, так как она уже должна существовать в миграции 001
    # op.create_table(...)

    # Добавляем новые колонки, которые отсутствуют в миграции 001, но есть в модели Alert
    op.add_column('alerts', sa.Column('severity', sa.String(), nullable=True))
    op.add_column('alerts', sa.Column('status', sa.String(), nullable=False, server_default='firing'))
    op.add_column('alerts', sa.Column('grafana_player_id', sa.String(), nullable=True))
    op.add_column('alerts', sa.Column('response', sa.String(), nullable=True))
    op.add_column('alerts', sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True))
    op.add_column('alerts', sa.Column('source', sa.String(), nullable=False))
    op.add_column('alerts', sa.Column('title', sa.String(), nullable=False))
    op.add_column('alerts', sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')))
    op.add_column('alerts', sa.Column('external_id', sa.String(), unique=True, index=True, nullable=True))
    op.add_column('alerts', sa.Column('details', sa.dialects.postgresql.JSONB, nullable=True))
    op.add_column('alerts', sa.Column('alert_name', sa.String(), nullable=False)) # alert_name, который отсутствует в 001

    # Изменяем существующие колонки, чтобы они соответствовали модели
    # device_id: nullable=False в 001, nullable=True в модели
    op.alter_column(
        'alerts', 'device_id',
        existing_type=sa.Integer(),
        nullable=True,
        existing_nullable=False
    )

    # created_at: без часового пояса и server_default в 001. Модель имеет timezone=True и server_default
    op.alter_column(
        'alerts', 'created_at',
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        nullable=False,
        existing_nullable=False,
        server_default=sa.text('now()')
    )


def downgrade():
    # Откатываем добавленные колонки (в обратном порядке)
    op.drop_column('alerts', 'alert_name')
    op.drop_column('alerts', 'details')
    op.drop_column('alerts', 'external_id')
    op.drop_column('alerts', 'timestamp')
    op.drop_column('alerts', 'title')
    op.drop_column('alerts', 'source')
    op.drop_column('alerts', 'updated_at')
    op.drop_column('alerts', 'response')
    op.drop_column('alerts', 'grafana_player_id')
    op.drop_column('alerts', 'status')
    op.drop_column('alerts', 'severity')

    # Откатываем измененные колонки
    op.alter_column(
        'alerts', 'created_at',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        nullable=False,
        existing_nullable=False,
        server_default=None # Откатываем к отсутствию server_default
    )
    op.alter_column(
        'alerts', 'device_id',
        existing_type=sa.Integer(),
        nullable=False, # Откатываем к nullable=False
        existing_nullable=True
    ) 