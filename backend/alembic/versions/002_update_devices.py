"""update devices table

Revision ID: 002
Revises: 001
Create Date: 2024-05-28 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Создаем enum тип для статуса устройства
    device_status = postgresql.ENUM('ONLINE', 'WARNING', 'OFFLINE', name='devicestatus')
    device_status.create(op.get_bind())
    
    # Добавляем недостающие колонки
    op.add_column('devices', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('devices', sa.Column('grafana_uid', sa.String(100), nullable=True))
    op.add_column('devices', sa.Column('client_id', sa.Integer(), nullable=True))
    op.add_column('devices', sa.Column('phone', sa.String(20), nullable=True))
    
    # Обновляем существующие значения статуса перед изменением типа
    op.execute("UPDATE devices SET status = 'ONLINE' WHERE status = 'active'")
    
    # Изменяем тип колонки status на enum
    op.execute("ALTER TABLE devices ALTER COLUMN status TYPE devicestatus USING status::devicestatus")
    
    # Добавляем foreign key и unique constraint
    op.create_foreign_key('fk_devices_client', 'devices', 'clients', ['client_id'], ['id'])
    op.create_unique_constraint('uq_devices_grafana_uid', 'devices', ['grafana_uid'])

    # Добавляем дефолтное устройство с id=1, если его нет
    # Это гарантирует, что устройство с id=1 всегда будет существовать перед вставками логов,
    # которые могут ссылаться на него.
    op.execute(
        """
        INSERT INTO devices (id, name, status, description, grafana_uid, phone, created_at)
        VALUES (1, 'Default Device', 'ONLINE', 'Автоматически созданное устройство для внутренних операций', 'default_device_1', '1234567890', NOW())
        ON CONFLICT (id) DO NOTHING;
        """
    )

def downgrade():
    # Удаляем foreign key и unique constraint
    op.drop_constraint('uq_devices_grafana_uid', 'devices', type_='unique')
    op.drop_constraint('fk_devices_client', 'devices', type_='foreignkey')
    
    # Возвращаем тип колонки status обратно в string
    op.execute("ALTER TABLE devices ALTER COLUMN status TYPE varchar USING status::varchar")
    
    # Удаляем колонки
    op.drop_column('devices', 'client_id')
    op.drop_column('devices', 'grafana_uid')
    op.drop_column('devices', 'description')
    op.drop_column('devices', 'phone')
    
    # Удаляем enum тип
    op.execute("DROP TYPE devicestatus") 