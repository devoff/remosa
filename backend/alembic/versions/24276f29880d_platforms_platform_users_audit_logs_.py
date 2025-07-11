"""platforms, platform_users, audit_logs, связь устройств с платформой

Revision ID: 24276f29880d
Revises: 3dcc96070dd4
Create Date: 2025-06-30 11:41:06.707917

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '24276f29880d'
down_revision: Union[str, None] = '3dcc96070dd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    conn = op.get_bind()
    
    # Check if platforms table exists before creating
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'platforms'
    """)).fetchone()
    
    if not result:
        op.create_table(
            'platforms',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('devices_limit', sa.Integer(), nullable=True),
            sa.Column('sms_limit', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name')
        )
        try:
            op.create_index(op.f('ix_platforms_id'), 'platforms', ['id'], unique=False)
        except Exception:
            pass
    
    # Check if audit_logs table exists before creating
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs'
    """)).fetchone()
    
    if not result:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('action', sa.String(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('platform_id', sa.Integer(), nullable=True),
            sa.Column('details', sa.String(), nullable=True),
            sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['platform_id'], ['platforms.id']),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        try:
            op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
        except Exception:
            pass
    
    # Check if platform_users table exists before creating
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'platform_users'
    """)).fetchone()
    
    if not result:
        op.create_table(
            'platform_users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('platform_id', sa.Integer(), nullable=False),
            sa.Column('role', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['platform_id'], ['platforms.id']),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        try:
            op.create_index(op.f('ix_platform_users_id'), 'platform_users', ['id'], unique=False)
        except Exception:
            pass
    
    # Check if user_limits table exists before creating (it might exist from previous migrations)
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_limits'
    """)).fetchone()
    
    if not result:
        op.create_table(
            'user_limits',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('max_devices', sa.Integer(), nullable=False),
            sa.Column('max_sms_messages', sa.Integer(), nullable=False),
            sa.Column('sms_messages_sent_current_period', sa.Integer(), nullable=False),
            sa.Column('sms_period_start_date', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id'),
            sa.UniqueConstraint('user_id', name='user_limits_user_id_key')
        )
        try:
            op.create_index(op.f('ix_user_limits_id'), 'user_limits', ['id'], unique=False)
        except Exception:
            pass
    
    # Check if platform_id column exists in devices table before adding
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' AND column_name = 'platform_id'
    """)).fetchone()
    
    if not result:
        op.add_column('devices', sa.Column('platform_id', sa.Integer(), nullable=True))
    
    # Check if foreign key constraint exists before creating
    result = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'devices' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%platform%'
    """)).fetchone()
    
    if not result:
        try:
            op.create_foreign_key(None, 'devices', 'platforms', ['platform_id'], ['id'])
        except Exception:
            pass
    op.alter_column('users', 'email',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('users', 'is_active',
               existing_type=sa.BOOLEAN(),
               nullable=True,
               existing_server_default=sa.text('true'))
    op.alter_column('users', 'created_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               nullable=True,
               existing_server_default=sa.text('now()'))
    op.alter_column('users', 'updated_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               nullable=True,
               existing_server_default=sa.text('now()'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('users', 'updated_at',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               nullable=False,
               existing_server_default=sa.text('now()'))
    op.alter_column('users', 'created_at',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               nullable=False,
               existing_server_default=sa.text('now()'))
    op.alter_column('users', 'is_active',
               existing_type=sa.BOOLEAN(),
               nullable=False,
               existing_server_default=sa.text('true'))
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('users', 'email',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_constraint(None, 'devices', type_='foreignkey')
    op.drop_column('devices', 'platform_id')
    op.drop_index(op.f('ix_user_limits_id'), table_name='user_limits')
    op.drop_table('user_limits')
    op.drop_index(op.f('ix_platform_users_id'), table_name='platform_users')
    op.drop_table('platform_users')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_index(op.f('ix_platforms_id'), table_name='platforms')
    op.drop_table('platforms')
    # ### end Alembic commands ###
