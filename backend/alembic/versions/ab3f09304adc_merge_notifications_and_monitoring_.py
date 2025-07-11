"""merge notifications and monitoring_metrics heads

Revision ID: ab3f09304adc
Revises: 64af5dff2095, 925de2dfb797
Create Date: 2025-07-11 11:53:43.857451

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab3f09304adc'
down_revision: Union[str, None] = ('64af5dff2095', '925de2dfb797')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
