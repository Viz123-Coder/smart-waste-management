"""
GET /api/alerts             -> all alerts (optionally filter with ?status=Open)
PUT /api/alerts/<id>/resolve -> mark an alert as resolved manually
"""

from flask import Blueprint, request, jsonify
from services.supabase_client import get_supabase

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("", methods=["GET"])
def get_alerts():
    status_filter = request.args.get("status")
    supabase = get_supabase()
    query = supabase.table("alerts").select("*").order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter)
    return jsonify(query.execute().data)


@alerts_bp.route("/<int:alert_id>/resolve", methods=["PUT"])
def resolve_alert(alert_id):
    supabase = get_supabase()
    result = supabase.table("alerts").update({"status": "Resolved"}).eq("id", alert_id).execute()
    if not result.data:
        return jsonify({"error": "Alert not found"}), 404
    return jsonify(result.data[0])
