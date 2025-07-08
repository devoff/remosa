"""merge heads

Revision ID: cacc06e38f01
Revises: a8c809f0031f, addcondactjobs1
Create Date: 2025-07-06 17:14:07.089735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cacc06e38f01'
down_revision: Union[str, None] = ('a8c809f0031f', 'addcondactjobs1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
