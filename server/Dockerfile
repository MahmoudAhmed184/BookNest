# syntax=docker/dockerfile:1.7

FROM python:3.14-slim AS base

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

FROM base AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        default-libmysqlclient-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock .python-version ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --only-group prod --no-install-project

COPY . .
RUN SECRET_KEY=build-only-placeholder \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    python manage.py collectstatic --noinput

FROM base AS runtime

ARG UID=1000
ARG GID=1000

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libmariadb3 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid "${GID}" app \
    && useradd --uid "${UID}" --gid app --home-dir /app --shell /usr/sbin/nologin app

COPY --from=builder --chown=app:app /app /app

RUN mkdir -p /app/media /app/logs /app/staticfiles \
    && chown -R app:app /app/media /app/logs /app/staticfiles

USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-"]
