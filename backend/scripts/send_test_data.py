"""
Test Data Simulator
=====================
Run this while your Flask backend is running to simulate ESP32 devices
sending sensor readings, WITHOUT needing the real hardware yet.

Usage:
    python scripts/send_test_data.py                 # sends one batch of readings
    python scripts/send_test_data.py --simulate 20    # sends 20 readings per bin,
                                                       # each with a slightly higher
                                                       # fill level (simulates a bin
                                                       # filling up over time - great
                                                       # for testing the ML prediction)
"""

import argparse
import random
import time
import requests

API_URL = "http://localhost:5000/api/sensor-data"

SAMPLE_BINS = [
    {"bin_id": "BIN001", "location": "Zone A - Market Street", "latitude": 13.0827, "longitude": 80.2707},
    {"bin_id": "BIN002", "location": "Zone B - Park Avenue", "latitude": 13.0900, "longitude": 80.2200},
    {"bin_id": "BIN003", "location": "Zone C - Bus Stand", "latitude": 13.0650, "longitude": 80.2500},
    {"bin_id": "BIN004", "location": "Zone D - Residential Block", "latitude": 13.1000, "longitude": 80.2900},
    {"bin_id": "BIN005", "location": "Zone E - School Road", "latitude": 13.0500, "longitude": 80.2400},
]


def send_reading(bin_info, fill_percentage):
    payload = {
        "bin_id": bin_info["bin_id"],
        "fill_percentage": round(fill_percentage, 1),
        "weight": round(fill_percentage * 0.18, 1),   # rough kg estimate for demo purposes
        "temperature": round(random.uniform(26, 34), 1),
        "location": bin_info["location"],
        "latitude": bin_info["latitude"],
        "longitude": bin_info["longitude"],
    }
    response = requests.post(API_URL, json=payload)
    print(f"-> {bin_info['bin_id']}: {payload['fill_percentage']}% | status {response.status_code}")
    return response


def send_one_batch():
    """Sends one random reading per bin - good for a quick manual check."""
    for bin_info in SAMPLE_BINS:
        send_reading(bin_info, random.uniform(10, 95))


def simulate_filling_over_time(num_readings):
    """
    Sends a series of readings per bin, each a bit higher than the last,
    to mimic a bin gradually filling up. This gives the ML predictor
    (which needs a history) something meaningful to learn a trend from.
    """
    for bin_info in SAMPLE_BINS:
        start = random.uniform(5, 25)
        rate = random.uniform(2, 6)  # % increase per reading
        for i in range(num_readings):
            fill = min(100, start + i * rate + random.uniform(-1.5, 1.5))
            send_reading(bin_info, fill)
            time.sleep(0.2)  # small delay so timestamps differ


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", type=int, help="Number of readings per bin to simulate filling up")
    args = parser.parse_args()

    if args.simulate:
        simulate_filling_over_time(args.simulate)
    else:
        send_one_batch()

    print("\nDone. Open the React dashboard to see the data.")
