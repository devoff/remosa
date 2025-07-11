"""fix_add_user_id_to_devices

Revision ID: 3dcc96070dd4
Revises: f6eacc8b57c9
Create Date: 2025-06-30 07:18:32.071285

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3dcc96070dd4'
down_revision: Union[str, None] = 'f6eacc8b57c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if user_id column exists before adding
    conn = op.get_bind()
    
    # Check if user_id column exists in devices table
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' AND column_name = 'user_id'
    """)).fetchone()
    
    if not result:
        # Добавляем поле user_id в таблицу devices
        op.add_column('devices', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Check if foreign key constraint exists before creating
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_devices_user_id' 
        AND table_name = 'devices'
    """)).fetchone()
    
    if not result:
        # Создаем внешний ключ для связи с таблицей users
        try:
            op.create_foreign_key('fk_devices_user_id', 'devices', 'users', ['user_id'], ['id'])
        except Exception:
            pass


def downgrade() -> None:
    # Удаляем внешний ключ
    op.drop_constraint('fk_devices_user_id', 'devices', type_='foreignkey')
    
    # Удаляем поле user_id
    op.drop_column('devices', 'user_id')
