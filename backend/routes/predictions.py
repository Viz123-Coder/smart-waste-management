"""
GET /api/predictions/<bin_id>  -> latest stored prediction for one bin
GET /api/predictions            -> latest prediction for every bin (dashboard summary)

Predictions are normally generated automatically every time new sensor data
arrives (see services/bin_service.py). These endpoints just read the most
recent one back out, and can also force a fresh recompute with ?refresh=true.
"""

from flask import Blueprint, jsonify, request
from services.supabase_client import get_supabase
from ml.predictor import predict_time_to_full
from ml.rf_predictor import predict_fill_level

predictions_bp = Blueprint("predictions", __name__)


@predictions_bp.route("/<bin_id>", methods=["GET"])
def get_prediction(bin_id):
    if request.args.get("refresh") == "true":
        return jsonify(predict_time_to_full(bin_id))

    supabase = get_supabase()
    result = (
        supabase.table("predictions")
        .select("*")
        .eq("bin_id", bin_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        # No stored prediction yet - compute one on the fly
        return jsonify(predict_time_to_full(bin_id))
    return jsonify(result.data[0])


@predictions_bp.route("", methods=["GET"])
def get_all_predictions():
    """One latest prediction per bin - powers the AI Predictions page list."""
    supabase = get_supabase()
    bins = supabase.table("bins").select("bin_id").execute().data
    output = []
    for b in bins:
        latest = (
            supabase.table("predictions")
            .select("*")
            .eq("bin_id", b["bin_id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if latest.data:
            output.append(latest.data[0])
    return jsonify(output)


@predictions_bp.route("/fill-level", methods=["POST"])
def get_fill_level_prediction():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    try:
        return jsonify(predict_fill_level(data))
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500