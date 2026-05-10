"""
app.py — FarmBrain Intelligence Engine API

This is the main Flask application. It exposes 6 API endpoints that
your teammates' modules will call:

  GET  /api/baseline   → ST (IoT Simulator): "What does normal look like?"
  GET  /api/forecast   → Angela (Dashboard): Weather widget + farm actions
  GET  /api/predict    → Angela (Dashboard): Seasonal Rule-Based sensor predictions
  POST /api/anomaly    → Yaoting (Automation): "Is this reading safe?"
  POST /api/simulate   → Dashboard: "What if I change X?" (Note: Logic built, endpoint pending)
  GET  /api/insights   → Angela (Dashboard): Master intelligence card (Combined Forecasts + Harvest)

Run with: python app.py
Server starts on: http://localhost:5001
"""

import sys
sys.stdout.reconfigure(encoding="utf-8")

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime, timezone

# Import our modules
import dataset
import weather
import forecast
import anomaly
import agri_logic
import simulator


# ---------------------------------------------------------------------------
# Flask App Setup
# ---------------------------------------------------------------------------
app = Flask(__name__)

# Enable CORS for ALL origins during development
# In production, restrict to specific origins like "http://localhost:5173"
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ---------------------------------------------------------------------------
# Load dataset on startup (once, not per request)
# ---------------------------------------------------------------------------
print("\n" + "=" * 60)
print("🌱 FarmBrain Intelligence Engine — Starting Up...")
print("=" * 60)

# Load and clean the CSV dataset
df = dataset.load_and_clean()

# Calculate baselines from historical data
baselines = dataset.calculate_baselines(df)

# Discover actuator-sensor correlations (for the simulator)
correlations = dataset.get_correlations(df)

print("-" * 60)


# ---------------------------------------------------------------------------
# Endpoint 1: GET /api/baseline
# Who calls this: ST (IoT Simulator)
# Purpose: Know what "normal" sensor values look like
# ---------------------------------------------------------------------------
@app.route("/api/baseline", methods=["GET"])
def get_baseline():
    """
    Return the calculated normal ranges for each sensor.

    Response:
    {
      "ph": { "mean": 5.73, "std": 0.16, "normal_min": 5.41, "normal_max": 6.05 },
      "ec_level": { ... },
      ...
    }
    """
    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "baselines": baselines,
        "source": "historical_dataset" if df is not None else "demo_defaults",
        "dataset_rows": len(df) if df is not None else 0,
    })


# ---------------------------------------------------------------------------
# Endpoint 2: GET /api/forecast
# Who calls this: Angela (Dashboard)
# Purpose: Weather forecast + farm action recommendations
# ---------------------------------------------------------------------------
@app.route("/api/forecast", methods=["GET"])
def get_forecast():
    """
    Fetch weather forecast and translate into farm actions.

    Query params (optional):
      lat — latitude (default: Johor Bahru 1.48)
      lon — longitude (default: Johor Bahru 103.76)

    Response includes: alerts, actions, insights, hourly data.
    """
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    result = weather.fetch_weather(lat=lat, lon=lon)
    return jsonify(result)


# ---------------------------------------------------------------------------
# Endpoint 3: GET /api/predict
# Who calls this: Angela (Dashboard)
# Purpose: SARIMA predictions for internal sensor trends
# ---------------------------------------------------------------------------
@app.route("/api/predict", methods=["GET"])
def get_predict():
    """
    Predict the next 6 hours of sensor values using SARIMA.

    Query params (optional):
      sensor — which sensor to predict (default: "temp_c")
      horizon — how many hours ahead (default: 6)

    Response includes: predictions, trend, confidence explanation.
    """
    sensor_name = request.args.get("sensor", "temp_c")
    horizon = request.args.get("horizon", 6, type=int)
    horizon = min(horizon, 96)  # Cap at 96 points (24 hours if 15min frequency)

    # Get time-series data from the dataset
    ts = dataset.get_time_series(df, sensor_name) if df is not None else None

    # Run SARIMA prediction
    result = forecast.predict_sensor(ts, column_name=sensor_name, horizon=horizon)

    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **result,
    })


# ---------------------------------------------------------------------------
# Endpoint 4: GET /api/history
# Who calls this: Angela (Dashboard)
# Purpose: Real historical data for the trend charts
# ---------------------------------------------------------------------------
@app.route("/api/history", methods=["GET"])
def get_history():
    """
    Return recent historical data for the trend chart.
    """
    limit = request.args.get("limit", 24, type=int)
    history = dataset.get_chart_data(df, limit=limit)
    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "history": history
    })


# ---------------------------------------------------------------------------
# Endpoint 5: POST /api/anomaly
# Who calls this: Yaoting (Automation Engine)
# Purpose: Check if a live sensor reading is safe
# ---------------------------------------------------------------------------
@app.route("/api/anomaly", methods=["POST"])
def check_anomaly():
    """
    Accept a live sensor reading and check for anomalies.

    Request body:
    {
      "ph": 7.2,
      "temp_c": 29.5,
      "humidity_pct": 72,
      "ec_level": 950,
      "water_level": 1.0
    }

    Response includes: anomalies list, all_normal flag.
    """
    # Get the sensor reading from the request body
    reading = request.get_json()

    if not reading:
        return jsonify({"error": "No sensor data provided. Send a JSON body."}), 400

    # Run anomaly detection with historical baselines
    result = anomaly.check_anomalies(reading, baselines=baselines)

    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **result,
    })


# ---------------------------------------------------------------------------
# Endpoint 6: POST /api/simulate
# Who calls this: Dashboard (What-If tool)
# Purpose: Predict the outcome of actuator changes
# ---------------------------------------------------------------------------
@app.route("/api/simulate", methods=["POST"])
def run_simulate():
    """
    Simulate the effect of changing actuator settings.

    Request body:
    {
      "adjustments": { "fan_speed": 20, "light_intensity": -10 },
      "current_state": { "temp_c": 25.0, "humidity_pct": 68.0 }
    }

    If "current_state" is omitted, uses the latest reading from the dataset.

    Response includes: predicted_state, impact, cost, recommendation.
    """
    data = request.get_json()

    if not data or "adjustments" not in data:
        return jsonify({
            "error": "Missing 'adjustments' in request body.",
            "example": {
                "adjustments": {"fan_speed": 20, "light_intensity": -10},
                "current_state": {"temp_c": 25.0, "humidity_pct": 68.0}
            }
        }), 400

    adjustments = data["adjustments"]
    current_state = data.get("current_state") or dataset.get_latest_reading(df)

    result = simulator.run_simulation(
        adjustments=adjustments,
        current_state=current_state,
        correlations=correlations,
    )

    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **result,
    })


# ---------------------------------------------------------------------------
# (Endpoint 6 removed — consolidated into Endpoint 7: get_merged_insights)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Helper: Build Compound Insights
# ---------------------------------------------------------------------------
def _build_compound_insights(anomalies, weather, predictions, mold, growth):
    """
    Generate multi-factor insights by combining data from all sources.
    These are the "smart" recommendations that wow the judges.

    Example:
      "Internal temperature is rising AND an external heatwave is forecast.
       Combined effect: Growth rate will drop 15%. Activate cooling NOW."
    """
    insights = []

    # --- Compound: High Temp + Heatwave ---
    temp_anomaly = any(
        a["sensor"] == "temp_c" and "HIGH" in a["status"]
        for a in anomalies.get("anomalies", [])
    )
    heatwave = "HIGH_TEMP" in weather.get("alerts", [])

    if temp_anomaly and heatwave:
        insights.append({
            "type": "COMPOUND_CRITICAL",
            "prediction": "Internal high temperature + external heatwave incoming",
            "impact": (
                f"Growth rate will drop to {growth['growth_rate_pct']}%. "
                f"Mold risk: {mold['risk_level']}."
            ),
            "action": "Set cooling system to MAXIMUM immediately. Consider emergency LED shutdown to reduce heat.",
        })
    elif heatwave:
        insights.append({
            "type": "PREEMPTIVE_WARNING",
            "prediction": "External heatwave forecast — internal temps may rise",
            "impact": "Potential growth slowdown if unchecked.",
            "action": "Pre-activate cooling fans before temperature peaks.",
        })

    # --- Compound: High Humidity + Rain ---
    humidity_high = any(
        a["sensor"] == "humidity_pct" and "HIGH" in a["status"]
        for a in anomalies.get("anomalies", [])
    )
    rain_forecast = "RAIN_FORECAST" in weather.get("alerts", [])

    if humidity_high and rain_forecast:
        insights.append({
            "type": "COMPOUND_CRITICAL",
            "prediction": "High humidity detected + rain forecast",
            "impact": f"Mold risk is {mold['risk_level']} ({mold['risk_index']}%). Crop infection likely.",
            "action": "Maximize ventilation NOW. Close external vents when rain begins.",
        })

    # --- Prediction-based: Rising temperature trend ---
    for pred in predictions:
        if pred.get("sensor") == "temp_c":
            trend = pred.get("trend", {})
            if trend.get("direction") == "rising" and abs(trend.get("delta", 0)) > 1:
                insights.append({
                    "type": "PREDICTIVE_WARNING",
                    "prediction": trend.get("description", "Temperature rising"),
                    "impact": (
                        f"If unchecked, growth rate may drop by "
                        f"{abs(growth['yield_change_pct'])}%."
                    ),
                    "action": "Increase fan speed by 15-20% in the next hour.",
                })

    # --- If everything is fine ---
    if not insights:
        insights.append({
            "type": "ALL_CLEAR",
            "prediction": "All systems operating within normal parameters",
            "impact": f"Growth rate: {growth['growth_rate_pct']}%. Mold risk: {mold['risk_level']}.",
            "action": "No action needed. Continue current settings.",
        })

    return insights


# ---------------------------------------------------------------------------
# Helper: Collect All Recommended Actions
# ---------------------------------------------------------------------------
def _collect_actions(anomalies, weather, predictions, mold):
    """
    Aggregate all recommended actions from every module into one list.
    The dashboard can display these as a prioritized to-do list.
    """
    actions = []

    # From weather forecast
    for action in weather.get("actions", []):
        actions.append({"source": "weather", "action": action, "priority": "MEDIUM"})

    # From anomalies
    for a in anomalies.get("anomalies", []):
        if a["severity"] == "CRITICAL":
            actions.append({
                "source": "anomaly",
                "action": f"Fix {a['sensor']}: {a['message']}",
                "priority": "HIGH",
            })

    # From mold risk
    if mold["risk_level"] in ["CRITICAL", "HIGH"]:
        actions.append({
            "source": "agri_logic",
            "action": "Increase ventilation to reduce mold risk",
            "priority": "HIGH",
        })

    # Sort by priority
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    actions.sort(key=lambda x: priority_order.get(x["priority"], 99))

    return actions


# ---------------------------------------------------------------------------
# Root endpoint (health check)
# ---------------------------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    """Simple health check / welcome page."""
    return jsonify({
        "service": "FarmBrain Intelligence Engine",
        "version": "1.0.0",
        "status": "running",
        "tester_ui": "http://localhost:5001/tester",
        "endpoints": [
            {"method": "GET",  "path": "/api/baseline",  "description": "Historical sensor baselines"},
            {"method": "GET",  "path": "/api/forecast",   "description": "Weather forecast + farm actions"},
            {"method": "GET",  "path": "/api/predict",    "description": "SARIMA sensor predictions"},
            {"method": "POST", "path": "/api/anomaly",    "description": "Live sensor anomaly check"},
            {"method": "POST", "path": "/api/simulate",   "description": "What-If simulation"},
            {"method": "GET",  "path": "/api/insights",   "description": "Master intelligence endpoint"},
        ],
    })


# ---------------------------------------------------------------------------
# Visual API Tester (open in browser to test all endpoints)
# ---------------------------------------------------------------------------
@app.route("/tester", methods=["GET"])
def tester():
    """Serves a beautiful visual API tester page."""
    return render_template("tester.html")


# ---------------------------------------------------------------------------
# Start the server
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# 7. Integrated Insights Endpoint (Unified — used by Climate.jsx)
# ---------------------------------------------------------------------------
@app.route('/api/insights', methods=['GET'])
def get_merged_insights():
    """
    Returns a unified JSON for the Climate dashboard.
    Shape:
    {
      "overall_status": "WARNING" | "STABLE" | "CRITICAL",
      "sensor_insights": ["pH trending up — may exceed 6.8 in ~45 min"],
      "recommended_actions": ["increase_fan_speed", "monitor_ph"],
      "sensor_trends": { "ph": { status, current, direction, minutes, unit, confidence, automation_response } },
      "harvest": [ { crop, zone, days, health, progress } ],
      "last_updated": "14:32:05"
    }
    """
    df_live = dataset.load_and_clean()

    # --- Automation response mapping (closed-loop logic) ---
    AUTOMATION_RESPONSES = {
        "temp_c":       "Cooling fans increased to 80%",
        "humidity_pct": "Exhaust fans activated at 70%",
        "ph":           "pH-down dosing pump activated",
        "ec_level":     "Nutrient injection adjusted",
        "water_temp_c": "Chiller compressor engaged",
    }

    # --- Confidence mapping based on data quality ---
    def _calc_confidence(ts):
        if ts is None or len(ts) < 20:
            return 60
        if len(ts) < 50:
            return 75
        return 87

    # --- 1. Sensor Trends for ALL 5 sensors ---
    sensor_trends = {}
    sensor_insights_list = []
    all_statuses = []

    for sensor in ["ph", "ec_level", "temp_c", "humidity_pct", "water_temp_c"]:
        ts = dataset.get_time_series(df_live, sensor) if df_live is not None else None
        trend = forecast.predict_trend(ts, sensor)
        limits = forecast.SENSOR_LIMITS.get(sensor, {})

        current_val = float(ts.iloc[-1]) if ts is not None and len(ts) > 0 else 0
        status = trend.get("status", "STABLE")
        slope = trend.get("slope", 0)
        minutes = trend.get("minutes", None)
        confidence = _calc_confidence(ts)

        # Direction
        if slope > 0.0001:
            direction = "rising"
        elif slope < -0.0001:
            direction = "falling"
        else:
            direction = "stable"

        # Automation response (only if not STABLE)
        auto_response = None
        if status in ["WARNING", "CRITICAL"]:
            auto_response = AUTOMATION_RESPONSES.get(sensor, "System monitoring active")
            sensor_insights_list.append(trend["message"])

        sensor_trends[sensor] = {
            "status": status,
            "current": round(current_val, 2),
            "direction": direction,
            "minutes": minutes,
            "unit": limits.get("unit", ""),
            "confidence": confidence,
            "predicted_1h": trend.get("predicted_1h"),
            "automation_response": auto_response,
        }
        all_statuses.append(status)

    # --- 2. Overall Status ---
    if "CRITICAL" in all_statuses:
        overall_status = "CRITICAL"
    elif "WARNING" in all_statuses:
        overall_status = "WARNING"
    else:
        overall_status = "STABLE"

    # --- 3. Recommended Actions ---
    recommended_actions = []
    if any(s["status"] != "STABLE" for s in sensor_trends.values()):
        for sensor, data in sensor_trends.items():
            if data["status"] in ["WARNING", "CRITICAL"]:
                recommended_actions.append(f"monitor_{sensor}")
        if sensor_trends.get("temp_c", {}).get("status") != "STABLE":
            recommended_actions.append("increase_fan_speed")
        if sensor_trends.get("humidity_pct", {}).get("status") != "STABLE":
            recommended_actions.append("activate_exhaust")

    # --- 4. Harvest Estimates (Hardcoded for 4 crops) ---
    harvest_data = [
        {
            "crop": "Lettuce",
            "zone": "Zone A · Rack 1-3",
            "days_elapsed": 22,
            "days_remaining": 5,
            "health_score": 88,
            "health_history": [95, 92, 88, 91, 85, 78, 90, 88, 92, 89, 88, 87, 89, 88, 90, 88, 87, 89, 88, 89, 90, 88],
            "base_yield_kg": 2.5,
            "progress": 81
        },
        {
            "crop": "Spinach",
            "zone": "Zone B · Rack 4-5",
            "days_elapsed": 18,
            "days_remaining": 22,
            "health_score": 71,
            "health_history": [90, 85, 80, 75, 70, 68, 72, 71, 73, 70, 69, 71, 72, 71, 70, 72, 71, 70],
            "base_yield_kg": 1.8,
            "progress": 45
        },
        {
            "crop": "Basil",
            "zone": "Zone C · Rack 6",
            "days_elapsed": 7,
            "days_remaining": 27,
            "health_score": 91,
            "health_history": [95, 94, 96, 92, 93, 91, 91],
            "base_yield_kg": 1.2,
            "progress": 20
        },
        {
            "crop": "Kangkung",
            "zone": "Zone D · Rack 7-8",
            "days_elapsed": 31,
            "days_remaining": 2,
            "health_score": 82,
            "health_history": [82] * 31,
            "base_yield_kg": 2.0,
            "progress": 94
        },
    ]

    # --- 5. Weather combination insight ---
    weather_data = weather.fetch_weather()
    ext_humidity_high = any(h['humidity_pct'] > 80 for h in weather_data.get('hourly', [])[:12])
    internal_hum_ts = dataset.get_time_series(df_live, "humidity_pct")
    hum_trend = forecast.predict_trend(internal_hum_ts, "humidity_pct")

    if ext_humidity_high and hum_trend['status'] != "STABLE":
        sensor_insights_list.insert(0, "Humidity likely to exceed 80% tonight — activate fans now")
    elif "RAIN_FORECAST" in weather_data.get('alerts', []):
        sensor_insights_list.insert(0, "Rain predicted: Close external vents to maintain internal stability.")

    if not sensor_insights_list:
        sensor_insights_list.append("All sensors operating within normal parameters.")

    return jsonify({
        "overall_status": overall_status,
        "sensor_insights": sensor_insights_list,
        "recommended_actions": recommended_actions,
        "sensor_trends": sensor_trends,
        "harvest": harvest_data,
        "last_updated": datetime.now().strftime("%H:%M:%S"),
        "timestamp": datetime.now().isoformat(),
        "status": "success",
    })

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🚀 Intelligence Engine is LIVE!")
    print("=" * 60)
    print(f"   Base URL:     http://localhost:5001")
    print(f"   Baseline:     http://localhost:5001/api/baseline")
    print(f"   Forecast:     http://localhost:5001/api/forecast")
    print(f"   Predict:      http://localhost:5001/api/predict")
    print(f"   Anomaly:      POST http://localhost:5001/api/anomaly")
    print(f"   Simulate:     POST http://localhost:5001/api/simulate")
    print(f"   Insights:     http://localhost:5001/api/insights")
    print("=" * 60 + "\n")

    app.run(debug=True, port=5001)
