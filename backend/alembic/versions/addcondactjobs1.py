"""
Add conditions and actions fields to jobs table
"""
from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

# revision identifiers, used by Alembic.
revision = 'addcondactjobs1'
down_revision = '027c9b714761'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('jobs', sa.Column('conditions', pg.JSON(), nullable=True))
    op.add_column('jobs', sa.Column('actions', pg.JSON(), nullable=True))

def downgrade():
    op.drop_column('jobs', 'conditions')
    op.drop_column('jobs', 'actions') 