"""add_superadmin_user

Revision ID: 587cab78bf8f
Revises: f58419763463
Create Date: 2025-01-20 11:56:55.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision: str = '587cab78bf8f'
down_revision: Union[str, None] = 'f58419763463'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create superadmin user
    conn = op.get_bind()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash("05021983")
    
    # Check if superadmin user already exists
    result = conn.execute(sa.text("""
        SELECT 1 FROM users WHERE email = 'admin@admin.ru'
    """)).fetchone()
    
    if not result:
        conn.execute(sa.text("""
            INSERT INTO users (email, hashed_password, is_active, role, platform_id, created_at, updated_at)
            VALUES ('admin@admin.ru', :hashed_password, true, 'superadmin', NULL, NOW(), NOW())
        """), {"hashed_password": hashed_password})
        
        print("✓ Superadmin user created: admin@admin.ru")
    else:
        print("✓ Superadmin user already exists: admin@admin.ru")


def downgrade() -> None:
    # Remove superadmin user
    conn = op.get_bind()
    conn.execute(sa.text("""
        DELETE FROM users WHERE email = 'admin@admin.ru' AND role = 'superadmin'
    """))
    print("✓ Superadmin user removed: admin@admin.ru")
