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
    # Сначала создаем таблицу alerts, если она не существует
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('device_id', sa.Integer(), sa.ForeignKey('devices.id'), nullable=True),
        sa.Column('alert_name', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # Дополнительные изменения (если нужны)
    op.add_column('alerts', sa.Column('severity', sa.String(), nullable=True))
    op.add_column('alerts', sa.Column('grafana_player_id', sa.String(), nullable=True))
    op.add_column('alerts', sa.Column('response', sa.String(), nullable=True))
    op.add_column('alerts', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('alerts', sa.Column('alert_type', sa.String(), nullable=True))

    # Изменение существующих колонок
    op.alter_column(
        'alerts', 'device_id',
        existing_type=sa.Integer(),
        nullable=True
    )

    # Изменяем created_at на DateTime с часовым поясом и server_default
    op.alter_column(
        'alerts', 'created_at',
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        nullable=False,
        existing_nullable=False,
        server_default=func.now()
    )


def downgrade():
    # Удаляем таблицу alerts (осторожно: это приведет к потере данных!)
    op.drop_table('alerts')

    # Откатываем изменения (в обратном порядке)
    # Удаляем добавленные столбцы
    op.drop_column('alerts', 'updated_at')
    op.drop_column('alerts', 'response')
    op.drop_column('alerts', 'grafana_player_id')
    op.drop_column('alerts', 'status')
    op.drop_column('alerts', 'severity')
    op.drop_column('alerts', 'alert_name')
    op.drop_column('alerts', 'alert_type')

    # Откатываем изменения существующих столбцов
    # Откатываем device_id на nullable=False
    op.alter_column(
        'alerts', 'device_id',
        existing_type=sa.Integer(),
        nullable=False,
        existing_nullable=True,
        # postgresql_using='device_id::integer'
    )

    # Откатываем created_at
    op.alter_column(
        'alerts', 'created_at',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        nullable=False,
        existing_nullable=False,
        server_default=None # Удаляем server_default
    ) 