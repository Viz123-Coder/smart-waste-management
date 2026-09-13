"""
Route Optimization Module
===========================
Goal: given a list of bins that need collection, produce a sensible visiting
order for the collection vehicle.

ALGORITHM: Nearest Neighbor with priority weighting
This is intentionally simple and explainable:

  1. Start at the depot (the waste facility).
  2. Repeatedly go to the *nearest unvisited bin*, but bins that are
     "critical" get a small priority boost so they aren't skipped in favor
     of a slightly-closer "full" bin.
  3. Stop when all bins needing collection have been visited, then return
     to the facility.

This is the classic "greedy" approach to the Traveling Salesman Problem.
It won't always find the mathematically perfect route, but it's fast,
easy to reason about, and good enough for a real-world collection run.
(A natural "future work" line for your report: swap this for 2-opt or
Google OR-Tools once the basic version is working.)
"""

import math

# Bonus subtracted from distance for higher-priority bins, so they get
# visited earlier even if a lower-priority bin is marginally closer.
PRIORITY_DISTANCE_BONUS_KM = {
    "critical": 1.5,
    "full": 0.5,
    "medium": 0,
    "empty": 0,
}


def haversine_distance_km(lat1, lon1, lat2, lon2):
    """Straight-line distance between two GPS points, in kilometers."""
    if None in (lat1, lon1, lat2, lon2):
        return float("inf")
    R = 6371  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def optimize_route(depot: dict, bins: list) -> dict:
    """
    depot: {"latitude": .., "longitude": ..}  (the waste facility location)
    bins: list of dicts, each with bin_id, latitude, longitude, status,
          current_fill_percentage

    Returns an ordered route with distances, e.g.:
    {
        "route": ["BIN003", "BIN007", "BIN002", "BIN010"],
        "stops": [ {...bin details + distance_from_previous_km...}, ... ],
        "total_distance_km": 12.4
    }
    """
    unvisited = [b for b in bins if b.get("latitude") is not None and b.get("longitude") is not None]
    skipped = [b["bin_id"] for b in bins if b not in unvisited]

    current_location = {"latitude": depot["latitude"], "longitude": depot["longitude"]}
    ordered_stops = []
    total_distance = 0.0

    while unvisited:
        best_bin = None
        best_effective_distance = float("inf")
        best_actual_distance = 0.0

        for b in unvisited:
            dist = haversine_distance_km(
                current_location["latitude"], current_location["longitude"],
                b["latitude"], b["longitude"]
            )
            bonus = PRIORITY_DISTANCE_BONUS_KM.get(b.get("status", "medium"), 0)
            effective_distance = max(0, dist - bonus)

            if effective_distance < best_effective_distance:
                best_effective_distance = effective_distance
                best_actual_distance = dist
                best_bin = b

        ordered_stops.append({**best_bin, "distance_from_previous_km": round(best_actual_distance, 2)})
        total_distance += best_actual_distance
        current_location = {"latitude": best_bin["latitude"], "longitude": best_bin["longitude"]}
        unvisited.remove(best_bin)

    # Final leg: last bin back to the facility
    return_leg = haversine_distance_km(
        current_location["latitude"], current_location["longitude"],
        depot["latitude"], depot["longitude"]
    )
    total_distance += return_leg

    return {
        "route": [s["bin_id"] for s in ordered_stops],
        "stops": ordered_stops,
        "return_to_facility_km": round(return_leg, 2),
        "total_distance_km": round(total_distance, 2),
        "skipped_bins_missing_coordinates": skipped,
    }
