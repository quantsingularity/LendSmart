import logging


def get_logger(name):
    """
    Simple logging utility to replace the missing core.logging.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        # Configure basic logging if not already configured
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[logging.StreamHandler()],
        )
    return logger
