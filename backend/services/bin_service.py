"""
Business logic for handling bins and sensor readings.

Routes stay thin (just HTTP in/out); the actual decisions - "does this bin
exist yet?", "has it crossed into critical?", "should we raise an alert?" -
live here so they can be reused and tested independently of Flask.
"""

from datetime import datetime, timezone
from services.supabase_client import get_supabase
from models.bin_status import classify_status, needs_collection
from ml.predictor import predict_time_to_full


def get_or_create_bin(bin_id: str, location: str = None, latitude: float = None, longitude: float = None):
    """Fetch a bin row by its human-readable bin_id, creating it if this is new hardware."""
    supabase = get_supabase()
    existing = supabase.table("bins").select("*").eq("bin_id", bin_id).execute()

    if existing.data:
        return existing.data[0]

    new_bin = {
        "bin_id": bin_id,
        "location": location or "Unassigned Zone",
        "latitude": latitude,
        "longitude": longitude,
        "status": "empty",
        "current_fill_percentage": 0,
        "current_weight": 0,
    }
    created = supabase.table("bins").insert(new_bin).execute()
    return created.data[0]


def ingest_sensor_reading(bin_id, fill_percentage, weight=None, temperature=None,
                           location=None, latitude=None, longitude=None):
    supabase = get_supabase()

    bin_row = get_or_create_bin(bin_id, location, latitude, longitude)
    status = classify_status(fill_percentage)
    now = datetime.now(timezone.utc).isoformat()

    # 1. Store the raw reading - this is the history the ML model learns from
    reading = {
        "bin_id": bin_id,
        "fill_percentage": fill_percentage,
        "weight": weight,
        "temperature": temperature,
        "timestamp": now,
    }
    supabase.table("sensor_readings").insert(reading).execute()

    # 2. Update the bin's "live" snapshot fields
    update_payload = {
        "status": status,
        "current_fill_percentage": fill_percentage,
        "current_weight": weight if weight is not None else bin_row.get("current_weight"),
        "last_updated": now,
    }
    if location:
        update_payload["location"] = location
    if latitude is not None:
        update_payload["latitude"] = latitude
    if longitude is not None:
        update_payload["longitude"] = longitude

    supabase.table("bins").update(update_payload).eq("bin_id", bin_id).execute()

    # 3. Raise an alert if this bin now needs urgent collection
    alert = None
    if needs_collection(fill_percentage):
        alert = _raise_alert_if_needed(bin_id, status, fill_percentage)

    # 4. Refresh the ML prediction using the fuller history we now have
    prediction = predict_time_to_full(bin_id)

    return {
        "message": "Sensor data received",
        "bin": {**bin_row, **update_payload, "bin_id": bin_id},
        "status": status,
        "alert_raised": alert is not None,
        "prediction": prediction,
    }


def _raise_alert_if_needed(bin_id, status, fill_percentage):
    """
    Avoid spamming duplicate alerts: only create a new alert if there isn't
    already an "Open" alert for this bin.
    """
    supabase = get_supabase()
    existing = (
        supabase.table("alerts")
        .select("id")
        .eq("bin_id", bin_id)
        .eq("status", "Open")
        .execute()
    )
    if existing.data:
        return None

    alert_type = "Critical Fill" if status == "critical" else "Full Bin"
    message = f"Bin {bin_id} is at {fill_percentage:.0f}% and requires collection."

    new_alert = {
        "bin_id": bin_id,
        "alert_type": alert_type,
        "message": message,
        "status": "Open",
    }
    created = supabase.table("alerts").insert(new_alert).execute()
    return created.data[0] if created.data else None
