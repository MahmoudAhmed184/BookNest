# BookNest - A Goodreads Alternative

BookNest is a Django REST Framework application that serves as an alternative to Goodreads, allowing users to discover, review, and manage their reading lists.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed on your system
- Git (to clone the repository)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/JinxX404/BookNest
   cd BookNest
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and update the values as needed, especially:
   - `DB_PASSWORD`: Set a secure password for PostgreSQL
   - `SECRET_KEY`: Generate a new Django secret key for production

3. **Build and run with Docker Compose**
   ```bash
   # Basic setup (Django + PostgreSQL)
   docker-compose up --build
   ```
<!--    
    # With pgAdmin for database management
   docker-compose --profile admin up --build
   
   # With Redis for caching
   docker-compose --profile cache up --build
   
   # Full setup with all services
   docker-compose --profile admin --profile cache up --build
   ``` -->

4. **Access the application**
   - Django API: http://localhost:8000
   - API Documentation: http://localhost:8000/swagger/
   - pgAdmin (if enabled): http://localhost:5050


### Available Services

| Service | Port | Description |
|---------|------|-------------|
| Django Web | 8000 | Main application |
| PostgreSQL | 5432 | Database |
| pgAdmin | 5050 | Database management (optional) |
| Redis | 6379 | Caching (optional) |

### Docker Commands

```bash
# Start services
docker-compose up

# Start services in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs
docker-compose logs web  # Specific service

# Rebuild containers
docker-compose up --build

# Run Django commands
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
docker-compose exec web python manage.py collectstatic

# Access container shell
docker-compose exec web bash
docker-compose exec db psql -U postgres -d booknest_db
```

### Environment Variables

Key environment variables in `.env`:

- **Django Settings**
  - `DEBUG`: Enable/disable debug mode
  - `SECRET_KEY`: Django secret key
  - `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

- **Database**
  - `DB_NAME`: PostgreSQL database name
  - `DB_USER`: PostgreSQL username
  - `DB_PASSWORD`: PostgreSQL password
  - `DB_HOST`: Database host (use 'db' for Docker)
  - `DB_PORT`: Database port

- **Cloudinary (Media Storage)**
  - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
  - `CLOUDINARY_API_KEY`: Your Cloudinary API key
  - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

<!-- ### Development

For development with live code reloading:

1. Mount your code as a volume in `docker-compose.yml`:
   ```yaml
   web:
     volumes:
       - .:/app
       - ./media:/app/media
       - ./logs:/app/logs
   ```

2. Use the development server:
   ```bash
   docker-compose exec web python manage.py runserver 0.0.0.0:8000
   ```

### Production Deployment

For production deployment:

1. Set `DEBUG=False` in your `.env` file
2. Generate a new `SECRET_KEY`
3. Update `ALLOWED_HOSTS` with your domain
4. Use a production WSGI server like Gunicorn:
   ```dockerfile
   CMD ["gunicorn", "--bind", "0.0.0.0:8000", "BookNest.wsgi:application"]
   ```

### Troubleshooting

**Database connection issues:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up --build
```

**Permission issues on Linux/Mac:**
```bash
# Make wait-for-db.sh executable
chmod +x wait-for-db.sh
```

**Clear Docker cache:**
```bash
docker system prune -a
docker-compose build --no-cache
```

## 🔒 Security First Setup

**IMPORTANT**: Before running the application, please follow the security setup:

1. **Copy environment template**: `cp .env.example .env`
2. **Generate secure keys**: `python generate_keys.py`
3. **Update your .env file** with the generated keys and your actual credentials
4. **Read the security guide**: See [SECURITY.md](SECURITY.md) for detailed instructions

⚠️ **Never commit your .env file or any files containing real secrets to version control!**

## 📱 API Endpoints

The application provides a comprehensive REST API. Visit http://localhost:8000/swagger/ for interactive API documentation.

## 🛠 Technology Stack

- **Backend**: Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT with django-allauth
- **Media Storage**: Cloudinary
- **API Documentation**: drf-spectacular
- **Containerization**: Docker & Docker Compose -->

## 📄 License

This project is licensed under the MIT License.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/JinxX404/BookNest)
