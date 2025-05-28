"""fix device status case

Revision ID: 004
Revises: 003
Create Date: 2024-05-28 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None

def upgrade():
    # Временно изменяем тип колонки на varchar
    op.execute("ALTER TABLE devices ALTER COLUMN status TYPE varchar USING status::varchar")
    
    # Удаляем старый enum тип
    op.execute("DROP TYPE devicestatus")
    
    # Создаем новый enum тип с значениями в верхнем регистре
    device_status = postgresql.ENUM('ONLINE', 'WARNING', 'OFFLINE', name='devicestatus')
    device_status.create(op.get_bind())
    
    # Обновляем существующие значения в верхний регистр
    op.execute("UPDATE devices SET status = upper(status)")
    
    # Изменяем тип колонки обратно на enum
    op.execute("ALTER TABLE devices ALTER COLUMN status TYPE devicestatus USING status::devicestatus")

def downgrade():
    # Временно изменяем тип колонки на varchar
    op.execute("ALTER TABLE devices ALTER COLUMN status TYPE varchar USING status::varchar")
    
    # Удаляем enum тип
    op.execute("DROP TYPE devicestatus")
    
    # Создаем старый enum тип
    device_status = postgresql.ENUM('online', 'warning', 'offline', name='devicestatus')
    device_status.create(op.get_bind())
    
    # Обновляем существующие значения в нижний регистр
    op.execute("UPDATE devices SET status = lower(status)")
    
    # Изменяем тип колонки обратно на enum
    op.execute("ALTER TABLE devices ALTER COLUMN status TYPE devicestatus USING status::devicestatus") 