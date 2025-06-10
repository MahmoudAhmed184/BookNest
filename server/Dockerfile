# Use Python 3.10 slim image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app
ENV PYTHONPATH="/app:$PYTHONPATH"
# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        curl \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY req.txt /app/
RUN pip install --no-cache-dir -r req.txt

# Copy project
COPY . /app/

# Copy wait-for-db script
COPY wait-for-db.sh /app/
RUN chmod +x /app/wait-for-db.sh

# Create media directory
RUN mkdir -p /app/media

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Set Django settings module for Docker
ENV DJANGO_SETTINGS_MODULE=BookNest.docker_settings

# Create logs directory
RUN mkdir -p /app/logs

# Run the application
CMD ["./wait-for-db.sh", "python", "manage.py", "runserver", "0.0.0.0:8000"]