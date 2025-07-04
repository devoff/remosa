# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.platform import Platform # noqa
from app.models.device import Device # noqa
from app.models.log import Log # noqa
from app.models.command_template import CommandTemplate # noqa
from app.models.alert import Alert # noqa
from app.models.audit_log import AuditLog # noqa