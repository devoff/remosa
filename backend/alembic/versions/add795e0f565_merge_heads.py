"""merge_heads

Revision ID: add795e0f565
Revises: 017_add_simpal_d410_commands, 5b4ae26c26f5
Create Date: 2025-07-09 21:01:35.547145

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add795e0f565'
down_revision: Union[str, None] = ('017_add_simpal_d410_commands', '5b4ae26c26f5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
