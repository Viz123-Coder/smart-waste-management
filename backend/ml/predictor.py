"""
AI Prediction Module
=====================
Goal: given a bin's recent history of fill-percentage readings, estimate
when it will reach 100% full.

WHY LINEAR REGRESSION (and not something fancier)?
This is deliberately the simplest model that solves the problem, which makes
it easy to explain in a viva:

  "Waste accumulates roughly at a steady rate over a short time window, so
   we fit a straight line through the last few readings (time vs. fill %)
   and extend that line forward to see when it crosses 100%."

That's it - no neural networks, no black box. scikit-learn's LinearRegression
does the line-fitting; the rest of this file is just preparing the data and
turning "y = mx + c" back into a human sentence like
"Expected to become full in approximately 8 hours."

As you collect more real data, this file is where you would swap in a more
advanced model (e.g. a model that also uses day-of-week / time-of-day
patterns) without touching any other part of the system.
"""

from datetime import datetime, timezone
import numpy as np
from sklearn.linear_model import LinearRegression

from services.supabase_client import get_supabase

# Need at least this many readings before we trust a trend line
MIN_READINGS_FOR_PREDICTION = 3

# Ignore predictions that imply an unrealistic fill rate (e.g. sensor noise
# from one single big jump), safety cap in hours
MAX_REASONABLE_HOURS = 24 * 14  # 14 days


def _fetch_recent_readings(bin_id: str, limit: int = 20):
    supabase = get_supabase()
    result = (
        supabase.table("sensor_readings")
        .select("fill_percentage, timestamp")
        .eq("bin_id", bin_id)
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )
    # Put back into chronological order (oldest -> newest) for regression
    return list(reversed(result.data)) if result.data else []


def predict_time_to_full(bin_id: str) -> dict:
    """
    Returns a dict describing the prediction, e.g.:
    {
        "bin_id": "BIN001",
        "current_fill_percentage": 65,
        "predicted_status": "will_reach_full",
        "estimated_hours_to_full": 8.2,
        "predicted_full_at": "2026-09-13T02:00:00+00:00",
        "fill_rate_per_hour": 4.1,
        "message": "Expected to become full in approximately 8 hours."
    }
    If there isn't enough history yet, it explains that instead of guessing.
    """
    readings = _fetch_recent_readings(bin_id)

    if len(readings) < MIN_READINGS_FOR_PREDICTION:
        result = {
            "bin_id": bin_id,
            "predicted_status": "insufficient_data",
            "message": (
                f"Need at least {MIN_READINGS_FOR_PREDICTION} readings to "
                f"predict a trend (have {len(readings)} so far)."
            ),
        }
        _store_prediction(bin_id, result)
        return result

    # Convert timestamps into "hours since the first reading" - this is the
    # X axis for our regression. Fill percentage is the Y axis.
    first_time = datetime.fromisoformat(readings[0]["timestamp"].replace("Z", "+00:00"))
    X, y = [], []
    for r in readings:
        t = datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00"))
        hours_elapsed = (t - first_time).total_seconds() / 3600.0
        X.append([hours_elapsed])
        y.append(r["fill_percentage"])

    X = np.array(X)
    y = np.array(y)

    model = LinearRegression()
    model.fit(X, y)

    slope = model.coef_[0]           # % fill increase per hour
    current_fill = y[-1]
    current_hour = X[-1][0]

    if slope <= 0.01:
        # Bin isn't filling up (flat or was just emptied/collected)
        result = {
            "bin_id": bin_id,
            "current_fill_percentage": round(float(current_fill), 1),
            "predicted_status": "stable",
            "fill_rate_per_hour": round(float(slope), 3),
            "message": "Fill level is stable or decreasing - no immediate collection needed.",
        }
        _store_prediction(bin_id, result)
        return result

    hours_to_full = (100 - current_fill) / slope
    hours_to_full = max(0, hours_to_full)

    if hours_to_full > MAX_REASONABLE_HOURS:
        result = {
            "bin_id": bin_id,
            "current_fill_percentage": round(float(current_fill), 1),
            "predicted_status": "slow_fill",
            "fill_rate_per_hour": round(float(slope), 3),
            "message": "Filling very slowly - not expected to need collection soon.",
        }
        _store_prediction(bin_id, result)
        return result

    predicted_time = datetime.now(timezone.utc).timestamp() + hours_to_full * 3600
    predicted_full_at = datetime.fromtimestamp(predicted_time, tz=timezone.utc).isoformat()

    result = {
        "bin_id": bin_id,
        "current_fill_percentage": round(float(current_fill), 1),
        "predicted_status": "will_reach_full",
        "estimated_hours_to_full": round(float(hours_to_full), 1),
        "predicted_full_at": predicted_full_at,
        "fill_rate_per_hour": round(float(slope), 3),
        "message": f"Expected to become full in approximately {hours_to_full:.1f} hours.",
    }
    _store_prediction(bin_id, result)
    return result


def _store_prediction(bin_id: str, result: dict):
    """Save every prediction to the `predictions` table so trends can be reviewed later."""
    try:
        supabase = get_supabase()
        supabase.table("predictions").insert({
            "bin_id": bin_id,
            "predicted_fill_percentage": result.get("current_fill_percentage"),
            "predicted_status": result.get("predicted_status"),
            "predicted_time": result.get("predicted_full_at"),
        }).execute()
    except Exception as e:
        # A failed prediction log should never break the sensor-data flow
        print(f"[predictor] Could not store prediction for {bin_id}: {e}")
