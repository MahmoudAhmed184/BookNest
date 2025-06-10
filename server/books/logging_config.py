import logging
import logging.handlers
import os
from datetime import datetime

# Create logs directory if it doesn't exist
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

# Configure logging format
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# Create formatters
formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

# Create handlers
# File handler for all logs
all_logs_file = os.path.join(LOGS_DIR, f'booknest_{datetime.now().strftime("%Y%m%d")}.log')
all_logs_handler = logging.handlers.RotatingFileHandler(
    all_logs_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
all_logs_handler.setFormatter(formatter)

# File handler for errors
error_logs_file = os.path.join(LOGS_DIR, f'booknest_errors_{datetime.now().strftime("%Y%m%d")}.log')
error_logs_handler = logging.handlers.RotatingFileHandler(
    error_logs_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
error_logs_handler.setFormatter(formatter)
error_logs_handler.setLevel(logging.ERROR)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(all_logs_handler)
root_logger.addHandler(error_logs_handler)
root_logger.addHandler(console_handler)

# Configure specific loggers
loggers = {
    'books.utils.search_service': logging.INFO,
    'books.utils.external_api_clients': logging.INFO,
    'books.views.search_views': logging.INFO,
    'books.tasks': logging.INFO,
}

for logger_name, level in loggers.items():
    logger = logging.getLogger(logger_name)
    logger.setLevel(level)

# Create a logger instance for use in other modules
logger = logging.getLogger(__name__)

def get_logger(name):
    """Get a logger instance with the specified name."""
    return logging.getLogger(name)