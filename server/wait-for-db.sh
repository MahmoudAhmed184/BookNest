#!/bin/bash

# wait-for-db.sh
# Script to wait for PostgreSQL to be ready before starting Django

set -e

host="$DB_HOST"
port="$DB_PORT"
user="$DB_USER"
password="$DB_PASSWORD"
db_name="$DB_NAME"

echo "Waiting for PostgreSQL at $host:$port..."

until PGPASSWORD=$password psql -h "$host" -p "$port" -U "$user" -d "$db_name" -c '\q'; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

>&2 echo "PostgreSQL is up - executing command"

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser if it doesn't exist..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@booknest.com').exists():
    User.objects.create_superuser(
        email='admin@booknest.com',
        password='admin123',
        username='admin'
    )
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"

# Execute the main command
exec "$@"