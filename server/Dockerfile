FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:$PYTHONPATH"
ENV DJANGO_SETTINGS_MODULE=config.settings.production

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.11.3 /uv /uvx /bin/

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        default-libmysqlclient-dev \
        mariadb-client \
        netcat-openbsd \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock .python-version /app/
RUN uv sync --frozen --only-group prod

COPY . /app/

RUN chmod +x /app/wait-for-db.sh \
    && mkdir -p /app/media /app/logs \
    && uv run python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["./wait-for-db.sh", "uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
