from alembic import op
import sqlalchemy as sa

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None

def upgrade():
    # Переименовываем колонку (для PostgreSQL)
    op.alter_column('command_templates', 'device_type', new_column_name='model')
    op.add_column('logs', sa.Column('status', sa.String(50), nullable=True))

    # Для других СУБД может потребоваться:
    # op.add_column('command_templates', sa.Column('model', sa.String(50)))
    # op.execute('UPDATE command_templates SET model = device_type')
    # op.drop_column('command_templates', 'device_type')

def downgrade():
    op.alter_column('command_templates', 'model', new_column_name='device_type')
    op.drop_column('logs', 'status')
