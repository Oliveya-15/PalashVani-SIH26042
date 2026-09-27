"""
NEW FILE -- Alembic's environment script. This is what connects Alembic's
generic migration machinery to this specific project: it points
`target_metadata` at the same `Base` every model in app/models/ already
shares, and reads the live connection string from
app.core.config.settings.DATABASE_URL (the exact same setting the app
itself uses) rather than duplicating it in alembic.ini.

Every model module is imported below purely so its table gets registered
on Base.metadata before Alembic reads it -- the same reason
app/database/init_db.py imports app.models.user (see that file's own
comment).
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.database.session import Base

# Import every model module so Base.metadata is fully populated.
from app.models import models  # noqa: F401  (languages, curriculum, translation_entries, history, feedback, dataset_metadata)
from app.models import user  # noqa: F401  (users)
from app.models import audit_log  # noqa: F401  (audit_log)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
