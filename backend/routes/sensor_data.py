"""
POST /api/sensor-data

This is the single most important endpoint in the whole system - it's the
"front door" that both the ESP32 hardware AND your own test scripts use to
feed data in.

Flow for every incoming reading:
1. Validate the payload
2. Make sure the bin exists in the `bins` table (create it if this is the
   very first reading we've ever seen from it)
3. Insert a row into `sensor_readings` (this builds the history used later
   by the ML model)
4. Recompute the bin's current status and update the `bins` table
5. Raise an alert if the bin just became "full" or "critical"
6. Ask the ML module to refresh its prediction for this bin

Because steps 2-6 are reused elsewhere, most of the actual work lives in
services/bin_service.py - this file just wires the HTTP request to it.
"""

from flask import Blueprint, request, jsonify
from services.bin_service import ingest_sensor_reading

sensor_data_bp = Blueprint("sensor_data", __name__)


@sensor_data_bp.route("", methods=["POST"])
def receive_sensor_data():
    payload = request.get_json(silent=True)

    if not payload:
        return jsonify({"error": "Request body must be JSON"}), 400

    bin_id = payload.get("bin_id")
    fill_percentage = payload.get("fill_percentage")

    if not bin_id:
        return jsonify({"error": "'bin_id' is required"}), 400
    if fill_percentage is None:
        return jsonify({"error": "'fill_percentage' is required"}), 400

    try:
        fill_percentage = float(fill_percentage)
    except (TypeError, ValueError):
        return jsonify({"error": "'fill_percentage' must be a number"}), 400

    if not (0 <= fill_percentage <= 100):
        return jsonify({"error": "'fill_percentage' must be between 0 and 100"}), 400

    result = ingest_sensor_reading(
        bin_id=bin_id,
        fill_percentage=fill_percentage,
        weight=payload.get("weight"),
        temperature=payload.get("temperature"),
        location=payload.get("location"),
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude"),
    )

    return jsonify(result), 201
