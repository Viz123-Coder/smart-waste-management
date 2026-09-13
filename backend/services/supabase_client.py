"""
A single, shared Supabase client.

Every route file imports `supabase` from here instead of creating its own
connection. This is the standard "singleton" pattern - one connection object,
reused everywhere.
"""

from supabase import create_client, Client
from config.config import Config

_client: Client = None


def get_supabase() -> Client:
    """Returns a ready-to-use Supabase client, creating it once on first use."""
    global _client
    if _client is None:
        if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_KEY are not set. "
                "Copy backend/.env.example to backend/.env and fill in your "
                "Supabase project credentials."
            )
        _client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    return _client
