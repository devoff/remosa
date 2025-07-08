from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('devices', sa.Column('model', sa.String(50), nullable=True))

def downgrade():
    op.drop_column('devices', 'model')