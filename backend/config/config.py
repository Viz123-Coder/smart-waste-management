"""
Configuration for the Flask backend.

We keep secrets (Supabase URL and API key) out of the code and in a .env file
instead. This is standard practice: it means you never accidentally commit
your database password to GitHub.

Before running the backend:
1. Copy `.env.example` to `.env`
2. Fill in your real Supabase project URL and API key (from Supabase dashboard
   -> Project Settings -> API)
"""

import os
from dotenv import load_dotenv

# Load variables from a .env file in the backend/ folder, if it exists
load_dotenv()


class Config:
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

    # Thresholds used to classify a bin's status from its fill percentage.
    # Centralizing these here means you only change them in one place.
    FILL_THRESHOLD_EMPTY = 30     # 0-30%    -> "empty"
    FILL_THRESHOLD_MEDIUM = 60    # 30-60%   -> "medium"
    FILL_THRESHOLD_FULL = 85      # 60-85%   -> "full"
    # above FILL_THRESHOLD_FULL   -> "critical"

    # A bin is flagged as "needs collection" once it crosses this percentage
    COLLECTION_TRIGGER_PERCENTAGE = 85
