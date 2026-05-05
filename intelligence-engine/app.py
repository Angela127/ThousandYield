"""
app.py — FarmBrain Intelligence Engine API

This is the main Flask application. It exposes 6 API endpoints that
your teammates' modules will call:

  GET  /api/baseline   → ST (IoT Simulator): "What does normal look like?"
  GET  /api/forecast    → Angela (Dashboard): Weather widget + farm actions
  GET  /api/predict     → Angela (Dashboard): SARIMA sensor predictions
  POST /api/anomaly     → Yaoting (Automation): "Is this reading safe?"
  POST /api/simulate    → Dashboard: "What if I change X?"
  GET  /api/insights    → Angela (Dashboard): Master intelligence card

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
    horizon = min(horizon, 24)  # Cap at 24 hours

    # Get time-series data from the dataset
    ts = dataset.get_time_series(df, sensor_name) if df is not None else None

    # Run SARIMA prediction
    result = forecast.predict_sensor(ts, column_name=sensor_name, horizon=horizon)

    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **result,
    })


# ---------------------------------------------------------------------------
# Endpoint 4: POST /api/anomaly
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
# Endpoint 5: POST /api/simulate
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
# Endpoint 6: GET /api/insights (THE MASTER ENDPOINT)
# Who calls this: Angela (Dashboard Smart Insights Card)
# Purpose: Merge everything into one actionable intelligence payload
# ---------------------------------------------------------------------------
@app.route("/api/insights", methods=["GET"])
def get_insights():
    """
    The "hero" endpoint. Combines:
      1. Current state (anomaly check on latest data)
      2. Weather forecast (external conditions)
      3. SARIMA predictions (internal future state)
      4. Agricultural impact (mold risk, growth rate, yield)
      5. Risk score (composite farm health score)

    Query params (optional):
      lat — latitude for weather forecast
      lon — longitude for weather forecast

    This is the single endpoint Angela needs for the Smart Insights card.
    """
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    # --- 1. Current State ---
    current_reading = dataset.get_latest_reading(df)
    anomaly_result = anomaly.check_anomalies(current_reading, baselines=baselines)

    # --- 2. Weather Forecast ---
    weather_result = weather.fetch_weather(lat=lat, lon=lon)

    # --- 3. SARIMA Predictions ---
    predictions = []
    for sensor in ["temp_c", "humidity_pct"]:
        ts = dataset.get_time_series(df, sensor) if df is not None else None
        pred = forecast.predict_sensor(ts, column_name=sensor, horizon=6)
        predictions.append(pred)

    # --- 4. Agricultural Impact ---
    current_temp = current_reading.get("temp_c", 25)
    current_humidity = current_reading.get("humidity_pct", 65)
    current_ph = current_reading.get("ph", 5.8)

    mold_risk = agri_logic.calc_mold_risk(current_temp, current_humidity)
    growth_impact = agri_logic.calc_growth_impact(current_temp, ph=current_ph)

    # --- 5. Compound Insights (the magic) ---
    compound_insights = _build_compound_insights(
        anomaly_result, weather_result, predictions, mold_risk, growth_impact
    )

    # --- 6. Risk Score ---
    risk_score = agri_logic.calc_risk_score(
        anomaly_result.get("anomalies", []),
        weather_result.get("alerts", []),
        predictions,
    )

    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "risk_score": risk_score,
        "current_state": {
            "reading": current_reading,
            "anomalies": anomaly_result,
        },
        "weather": {
            "forecast_24h": weather_result.get("forecast_24h"),
            "alerts": weather_result.get("alerts", []),
            "insights": weather_result.get("insights", []),
        },
        "predictions": predictions,
        "impact": {
            "mold_risk": mold_risk,
            "growth": growth_impact,
        },
        "compound_insights": compound_insights,
        "recommended_actions": _collect_actions(
            anomaly_result, weather_result, predictions, mold_risk
        ),
        "overall_status": risk_score["status"],
    })


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
# 7. Integrated Insights Endpoint (Requirement: Merged JSON)
# ---------------------------------------------------------------------------
@app.route('/api/insights', methods=['GET'])
def get_merged_insights():
    """
    Returns a merged JSON containing Forecast, Predictive Alerts, and Harvest Estimate.
    """
    df = dataset.load_and_clean()
    
    # 1. Weather + Trend Combination Logic
    weather_data = weather.fetch_weather()
    ext_humidity_high = any(h['humidity_pct'] > 80 for h in weather_data['hourly'][:12])
    
    # Check internal humidity trend
    internal_hum_ts = dataset.get_time_series(df, "humidity_pct")
    hum_trend = forecast.predict_trend(internal_hum_ts, "humidity_pct")
    
    weather_insight = "Conditions stable."
    if ext_humidity_high and hum_trend['status'] != "STABLE":
        weather_insight = "Humidity likely to exceed 80% tonight — activate fans now"
    elif "RAIN_FORECAST" in weather_data['alerts']:
        weather_insight = "Rain predicted: Close external vents to maintain internal stability."

    # 2. Predictive Alerts for all sensors
    predictive_alerts = []
    for s in ["ph", "ec_level", "temp_c"]:
        ts = dataset.get_time_series(df, s)
        predictive_alerts.append(forecast.predict_trend(ts, s))

    # 3. Harvest Estimate
    harvest = forecast.estimate_harvest(df, "lettuce")

    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "weather_condition_forecast": {
            "summary": weather_insight,
            "external_data": weather_data['forecast_24h']
        },
        "predictive_alerts": predictive_alerts,
        "harvest_estimate": harvest,
        "status": "success"
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
