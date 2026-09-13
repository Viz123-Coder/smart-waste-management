"""
POST /api/dumping-reports -> create a report of illegal dumping
GET  /api/dumping-reports -> list reports (optionally ?status=Open)
PUT  /api/dumping-reports/<id> -> update a report's status

Kept deliberately simple for v1: it's a reporting system, not an AI
detector. The `image` field just stores a URL/path for now (e.g. an image
uploaded to Supabase Storage) - a natural place to later plug in an
image-classification model.
"""

from flask import Blueprint, request, jsonify
from services.supabase_client import get_supabase

dumping_bp = Blueprint("dumping_reports", __name__)


@dumping_bp.route("", methods=["POST"])
def create_report():
    payload = request.get_json(silent=True) or {}
    location = payload.get("location")

    if not location:
        return jsonify({"error": "'location' is required"}), 400

    supabase = get_supabase()
    report = {
        "location": location,
        "latitude": payload.get("latitude"),
        "longitude": payload.get("longitude"),
        "image": payload.get("image"),
        "description": payload.get("description"),
        "status": "Open",
    }
    created = supabase.table("dumping_reports").insert(report).execute()
    return jsonify(created.data[0]), 201


@dumping_bp.route("", methods=["GET"])
def get_reports():
    status_filter = request.args.get("status")
    supabase = get_supabase()
    query = supabase.table("dumping_reports").select("*").order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter)
    return jsonify(query.execute().data)


@dumping_bp.route("/<int:report_id>", methods=["PUT"])
def update_report(report_id):
    payload = request.get_json(silent=True) or {}
    new_status = payload.get("status")
    if new_status not in ("Open", "Investigating", "Resolved"):
        return jsonify({"error": "status must be Open, Investigating, or Resolved"}), 400

    supabase = get_supabase()
    result = supabase.table("dumping_reports").update({"status": new_status}).eq("id", report_id).execute()
    if not result.data:
        return jsonify({"error": "Report not found"}), 404
    return jsonify(result.data[0])
