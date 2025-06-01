"""Change extra_data to JSONB in logs table

Create Date: 2024-07-26 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    # Пытаемся преобразовать строковые представления Python-словарей в валидный JSON
    # Это поможет с одинарными кавычками и Python-ключевыми словами (None, True, False)
    op.alter_column(
        'logs',
        'extra_data',
        existing_type=sa.String(),
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_nullable=True,
        postgresql_using="REPLACE(REPLACE(REPLACE(REPLACE(extra_data, chr(39), chr(34)), 'None', 'null'), 'True', 'true'), 'False', 'false')::jsonb"
    )


def downgrade():
    op.alter_column(
        'logs',
        'extra_data',
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        type_=sa.String(),
        existing_nullable=True
    ) 