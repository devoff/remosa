from alembic import op
import sqlalchemy as sa

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('alerts', sa.Column('data', sa.JSON, nullable=True))
    op.add_column('alerts', sa.Column('source', sa.String(), nullable=False))
    op.add_column('alerts', sa.Column('title', sa.String(), nullable=False))
    op.add_column('alerts', sa.Column('timestamp', sa.DateTime(), nullable=False))
    op.add_column('alerts', sa.Column('external_id', sa.String(), unique=True, index=True, nullable=True))
    op.add_column('alerts', sa.Column('details', sa.dialects.postgresql.JSONB, nullable=True))

def downgrade():
    op.drop_column('alerts', 'data')
    op.drop_column('alerts', 'source')
    op.drop_column('alerts', 'title')
    op.drop_column('alerts', 'timestamp')
    op.drop_column('alerts', 'external_id')
    op.drop_column('alerts', 'details') 