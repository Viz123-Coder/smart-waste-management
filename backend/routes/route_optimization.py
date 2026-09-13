"""
GET /api/route-optimize

Builds a collection route across every bin that currently needs collection
(status 'full' or 'critical'). Optional query params:

  ?min_status=full        (default) include full + critical bins
  ?facility_lat=..&facility_lng=..   override the default facility location

Returns the ordered stop list from ml/route_optimizer.py.
"""

from flask import Blueprint, request, jsonify
from services.supabase_client import get_supabase
from ml.route_optimizer import optimize_route

route_bp = Blueprint("route_optimization", __name__)

# Default depot location - replace with your actual waste facility coordinates.
# (Sample coordinates: a generic point in Chennai, India, since bins are zone-based.)
DEFAULT_FACILITY = {"latitude": 13.0827, "longitude": 80.2707}

STATUS_PRIORITY = {"empty": 0, "medium": 1, "full": 2, "critical": 3}


@route_bp.route("", methods=["GET"])
def get_optimized_route():
    min_status = request.args.get("min_status", default="full")
    min_rank = STATUS_PRIORITY.get(min_status, 2)

    supabase = get_supabase()
    all_bins = supabase.table("bins").select("*").execute().data
    candidates = [b for b in all_bins if STATUS_PRIORITY.get(b.get("status"), 0) >= min_rank]

    if not candidates:
        return jsonify({
            "message": "No bins currently require collection.",
            "route": [],
            "stops": [],
            "total_distance_km": 0,
        })

    facility = {
        "latitude": request.args.get("facility_lat", type=float) or DEFAULT_FACILITY["latitude"],
        "longitude": request.args.get("facility_lng", type=float) or DEFAULT_FACILITY["longitude"],
    }

    result = optimize_route(facility, candidates)
    result["facility"] = facility
    return jsonify(result)
