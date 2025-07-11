"""add params_schema for duration to power-off command

Revision ID: 59b3085fc5c5
Revises: add795e0f565
Create Date: 2025-07-09 22:30:37.162458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = '59b3085fc5c5'
down_revision: Union[str, None] = 'add795e0f565'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    command_name = 'Выключить питание на определенное время'
    params_schema = {
        "type": "object",
        "properties": {
            "duration": {
                "type": "integer",
                "title": "Время (минуты)"
            }
        },
        "required": ["duration"]
    }
    conn.execute(
        sa.text("""
            UPDATE command_templates
            SET params_schema = :params_schema
            WHERE name = :command_name
        """),
        {"params_schema": json.dumps(params_schema), "command_name": command_name}
    )


def downgrade() -> None:
    conn = op.get_bind()
    command_name = 'Выключить питание на определенное время'
    conn.execute(
        sa.text("""
            UPDATE command_templates
            SET params_schema = NULL
            WHERE name = :command_name
        """),
        {"command_name": command_name}
    )
