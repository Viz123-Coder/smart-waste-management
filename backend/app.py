"""
Smart Waste Management System - Flask Backend
================================================
This is the main entry point of the backend server.

What this file does:
1. Creates the Flask app
2. Enables CORS (so the React frontend, running on a different port, can call this API)
3. Registers all the route "blueprints" (each file in routes/ handles one feature area)
4. Starts the server

Run it with:  python app.py
"""

from flask import Flask, jsonify
from flask_cors import CORS

from config.config import Config
from routes.bins import bins_bp
from routes.sensor_data import sensor_data_bp
from routes.readings import readings_bp
from routes.predictions import predictions_bp
from routes.collections import collections_bp
from routes.alerts import alerts_bp
from routes.dumping_reports import dumping_bp
from routes.route_optimization import route_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow the React dev server (and later, any deployed frontend) to call this API
    CORS(app)

    # Every blueprint owns a piece of the API. This keeps each file small and focused,
    # which makes the project much easier to explain during a viva.
    app.register_blueprint(bins_bp, url_prefix="/api/bins")
    app.register_blueprint(sensor_data_bp, url_prefix="/api/sensor-data")
    app.register_blueprint(readings_bp, url_prefix="/api/readings")
    app.register_blueprint(predictions_bp, url_prefix="/api/predictions")
    app.register_blueprint(collections_bp, url_prefix="/api/collections")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(dumping_bp, url_prefix="/api/dumping-reports")
    app.register_blueprint(route_bp, url_prefix="/api/route-optimize")

    @app.route("/")
    def health_check():
        """Simple endpoint to confirm the server is alive. Visit http://localhost:5000/"""
        return jsonify({
            "status": "ok",
            "service": "Smart Waste Management API",
            "message": "Backend is running. See README for available endpoints."
        })

    return app


app = create_app()

if __name__ == "__main__":
    # debug=True auto-reloads the server when you edit code - very useful while learning
    app.run(host="0.0.0.0", port=5000, debug=True)
