"""
Shared logic for turning a raw fill percentage into a human-readable status.

Keeping this in one place means the dashboard cards, the live-bin list, and
the alert system all agree on what "full" or "critical" means.
"""

from config.config import Config


def classify_status(fill_percentage: float) -> str:
    """
    Convert a fill percentage (0-100) into one of:
    'empty', 'medium', 'full', 'critical'
    """
    if fill_percentage is None:
        return "unknown"
    if fill_percentage < Config.FILL_THRESHOLD_EMPTY:
        return "empty"
    elif fill_percentage < Config.FILL_THRESHOLD_MEDIUM:
        return "medium"
    elif fill_percentage < Config.FILL_THRESHOLD_FULL:
        return "full"
    else:
        return "critical"


def needs_collection(fill_percentage: float) -> bool:
    return fill_percentage is not None and fill_percentage >= Config.COLLECTION_TRIGGER_PERCENTAGE
