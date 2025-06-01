from alembic import op
import sqlalchemy as sa

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('alerts', sa.Column('alert_type', sa.String(), nullable=True))

def downgrade():
    op.drop_column('alerts', 'alert_type') 