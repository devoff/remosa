from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None

def upgrade():
    # Добавление столбца 'role' в таблицу 'users'
    op.add_column('users', sa.Column('role', sa.String(), nullable=False, server_default='user'))

    # Создание таблицы 'user_limits'
    op.create_table(
        'user_limits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('max_devices', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('max_sms_messages', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('sms_messages_sent_current_period', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('sms_period_start_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], unique=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Добавление столбца 'user_id' в таблицу 'devices'
    op.add_column('devices', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_devices_user_id', 'devices', 'users', ['user_id'], ['id'])

def downgrade():
    # Откат изменений для 'devices'
    op.drop_constraint('fk_devices_user_id', 'devices', type_='foreignkey')
    op.drop_column('devices', 'user_id')

    # Удаление таблицы 'user_limits'
    op.drop_table('user_limits')

    # Удаление столбца 'role' из таблицы 'users'
    op.drop_column('users', 'role') 