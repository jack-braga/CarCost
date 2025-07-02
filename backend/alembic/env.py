from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

import os
import sys

# Add the app directory to sys.path so imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load settings and models
from app.core.config import settings
from app.db.base import Base  # this imports all models, e.g., User

# Set up Alembic configuration
config = context.config

# Inject the database URL from settings into Alembic config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set target_metadata for autogeneration
target_metadata = Base.metadata

# Set up Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Offline migrations
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# Online migrations
def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

# Run the appropriate mode
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
