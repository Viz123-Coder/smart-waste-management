"""
GET /api/readings/<bin_id>

Returns the historical sensor readings for one bin, oldest -> newest.
Used to draw the fill-level-over-time chart on the Bin Details page.
"""

from flask import Blueprint, jsonify, request
from services.supabase_client import get_supabase

readings_bp = Blueprint("readings", __name__)


@readings_bp.route("/<bin_id>", methods=["GET"])
def get_readings(bin_id):
    limit = request.args.get("limit", default=50, type=int)
    supabase = get_supabase()
    result = (
        supabase.table("sensor_readings")
        .select("*")
        .eq("bin_id", bin_id)
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )
    # Return oldest -> newest so charts plot left-to-right correctly
    return jsonify(list(reversed(result.data)))
