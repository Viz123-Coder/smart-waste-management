"""
POST /api/collections -> mark a bin as collected
GET  /api/collections -> collection history (for the Collections page table)

Marking a bin "collected" does two things:
1. Logs a row in `collections` (what/when/how much was collected)
2. Resets the bin's live status back to "empty" and closes any open alerts
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from services.supabase_client import get_supabase

collections_bp = Blueprint("collections", __name__)


@collections_bp.route("", methods=["POST"])
def record_collection():
    payload = request.get_json(silent=True) or {}
    bin_id = payload.get("bin_id")

    if not bin_id:
        return jsonify({"error": "'bin_id' is required"}), 400

    supabase = get_supabase()
    bin_result = supabase.table("bins").select("*").eq("bin_id", bin_id).execute()
    if not bin_result.data:
        return jsonify({"error": f"Bin '{bin_id}' not found"}), 404

    bin_row = bin_result.data[0]
    now = datetime.now(timezone.utc).isoformat()

    collection_record = {
        "bin_id": bin_id,
        "collection_time": now,
        "previous_fill_level": bin_row.get("current_fill_percentage"),
        "collected_weight": payload.get("collected_weight", bin_row.get("current_weight")),
        "worker_id": payload.get("worker_id"),
        "vehicle_id": payload.get("vehicle_id"),
    }
    created = supabase.table("collections").insert(collection_record).execute()

    # Reset the bin to empty after collection
    supabase.table("bins").update({
        "status": "empty",
        "current_fill_percentage": 0,
        "current_weight": 0,
        "last_updated": now,
    }).eq("bin_id", bin_id).execute()

    # Close any open alerts for this bin, since it's now been emptied
    supabase.table("alerts").update({"status": "Resolved"}).eq("bin_id", bin_id).eq("status", "Open").execute()

    return jsonify({"message": f"Collection recorded for {bin_id}", "collection": created.data[0]}), 201


@collections_bp.route("", methods=["GET"])
def get_collections():
    supabase = get_supabase()
    result = supabase.table("collections").select("*").order("collection_time", desc=True).execute()
    return jsonify(result.data)
