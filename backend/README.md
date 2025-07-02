# Backend Commands:
- `uv pip install .` install all the packages described in `pyproject.toml` - **avoid**
- `uv pip sync` install all packages described in `uv.lock` - **prefer**
- `uvicorn app.main:app --reload` this starts the backend app in dev mode
- `alembic revision --autogenerate -m "create users table"` applies model changes from `app/models/*` to the ORM
- `alembic upgrade head` applies model changes to the db