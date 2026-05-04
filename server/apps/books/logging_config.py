import logging


logger = logging.getLogger('apps.books')


def get_logger(name):
    """Get a logger instance with the specified name."""
    return logging.getLogger(name)
