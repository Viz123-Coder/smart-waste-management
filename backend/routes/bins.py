"""
GET /api/bins          -> all bins (for dashboard + live monitoring + map)
GET /api/bins/<bin_id> -> a single bin's current snapshot
"""

from flask import Blueprint, jsonify
from services.supabase_client import get_supabase

bins_bp = Blueprint("bins", __name__)


@bins_bp.route("", methods=["GET"])
def get_all_bins():
    supabase = get_supabase()
    result = supabase.table("bins").select("*").order("bin_id").execute()
    return jsonify(result.data)


@bins_bp.route("/<bin_id>", methods=["GET"])
def get_bin(bin_id):
    supabase = get_supabase()
    result = supabase.table("bins").select("*").eq("bin_id", bin_id).execute()
    if not result.data:
        return jsonify({"error": f"Bin '{bin_id}' not found"}), 404
    return jsonify(result.data[0])
