"""
weather.py — External Weather Intelligence

This module fetches weather forecasts from the Open-Meteo API and
translates raw meteorological data into actionable farm recommendations.

Features:
  - Dynamic location support (lat/lon parameters)
  - Solar radiation analysis (direct + diffuse)
  - Precipitation risk alerts
  - Graceful offline fallback (never crashes)

Used by:
  - app.py → GET /api/forecast
  - app.py → GET /api/insights (weather portion)
"""

import sys
sys.stdout.reconfigure(encoding="utf-8")

import requests
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Open-Meteo API configuration
# ---------------------------------------------------------------------------
BASE_URL = "https://api.open-meteo.com/v1/forecast"

# Default location: Johor Bahru, Malaysia
DEFAULT_LAT = 1.48
DEFAULT_LON = 103.76

# What we request from the API
HOURLY_PARAMS = [
    "temperature_2m",
    "relativehumidity_2m",
    "precipitation_probability",
    "direct_radiation",
    "diffuse_radiation",
]

# ---------------------------------------------------------------------------
# Alert thresholds
# ---------------------------------------------------------------------------
HUMIDITY_THRESHOLD = 80     # % → triggers HIGH_HUMIDITY alert
TEMP_THRESHOLD = 30         # °C → triggers HIGH_TEMP alert
RAIN_THRESHOLD = 60         # % probability → triggers RAIN_FORECAST alert
SOLAR_HIGH_THRESHOLD = 800  # W/m² → triggers HIGH_SOLAR alert
SOLAR_MOD_THRESHOLD = 400   # W/m² → moderate solar load


# ---------------------------------------------------------------------------
# 1. Fetch Weather Forecast
# ---------------------------------------------------------------------------
def fetch_weather(lat=None, lon=None):
    """
    Fetch a 48-hour weather forecast from Open-Meteo.

    This function:
      1. Calls the Open-Meteo API with the given coordinates.
      2. Extracts the next 24 hours of data.
      3. Analyzes for farm-relevant alerts (heat, humidity, rain, solar).
      4. Generates human-readable insights and recommended actions.

    Args:
      lat: latitude (defaults to Johor Bahru)
      lon: longitude (defaults to Johor Bahru)

    Returns:
      dict with forecast data, alerts, actions, and insights.
      NEVER raises an exception — returns demo data on failure.
    """
    lat = lat or DEFAULT_LAT
    lon = lon or DEFAULT_LON

    try:
        raw_data = _call_api(lat, lon)
        return _process_forecast(raw_data, lat, lon)
    except Exception as e:
        print(f"⚠️  Weather API failed: {e}")
        print("   Returning demo forecast data.")
        return _demo_forecast(lat, lon)


# ---------------------------------------------------------------------------
# 2. Internal: Call the API
# ---------------------------------------------------------------------------
def _call_api(lat, lon):
    """
    Make the HTTP request to Open-Meteo.
    Timeout is 10 seconds to avoid hanging during a hackathon demo.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(HOURLY_PARAMS),
        "forecast_days": 2,
    }

    response = requests.get(BASE_URL, params=params, timeout=10)
    response.raise_for_status()  # Raise error if status != 200
    return response.json()


# ---------------------------------------------------------------------------
# 3. Internal: Process the raw API response
# ---------------------------------------------------------------------------
def _process_forecast(data, lat, lon):
    """
    Transform raw Open-Meteo JSON into farm-actionable intelligence.

    Steps:
      1. Slice the first 24 hours of hourly data.
      2. Find max temperature, max humidity, peak solar radiation.
      3. Check each value against thresholds to generate alerts.
      4. Convert alerts into plain-English insights and recommended actions.
    """
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])[:24]
    temps = hourly.get("temperature_2m", [])[:24]
    humids = hourly.get("relativehumidity_2m", [])[:24]
    precip = hourly.get("precipitation_probability", [])[:24]
    direct_rad = hourly.get("direct_radiation", [])[:24]
    diffuse_rad = hourly.get("diffuse_radiation", [])[:24]

    # --- Calculate summary statistics ---
    max_temp = max(temps) if temps else 0
    max_humidity = max(humids) if humids else 0
    max_precip = max(precip) if precip else 0
    max_solar = max(direct_rad) if direct_rad else 0
    avg_solar = sum(direct_rad) / len(direct_rad) if direct_rad else 0

    # Determine solar load level
    if max_solar > SOLAR_HIGH_THRESHOLD:
        solar_level = "HIGH"
    elif max_solar > SOLAR_MOD_THRESHOLD:
        solar_level = "MODERATE"
    else:
        solar_level = "LOW"

    # --- Generate alerts ---
    alerts = []
    actions = []
    insights = []

    if max_humidity > HUMIDITY_THRESHOLD:
        alerts.append("HIGH_HUMIDITY")
        actions.append("increase_fan_speed")
        insights.append(
            f"Humidity forecast to reach {max_humidity}% — "
            f"pre-activate exhaust fans tonight to prevent mold."
        )

    if max_temp > TEMP_THRESHOLD:
        alerts.append("HIGH_TEMP")
        actions.append("activate_cooling")
        insights.append(
            f"External temperature expected to hit {max_temp}°C — "
            f"increase cooling system power to protect crops."
        )

    if max_precip > RAIN_THRESHOLD:
        alerts.append("RAIN_FORECAST")
        actions.append("reduce_ventilation")
        insights.append(
            f"Rain probability reaches {max_precip}% — "
            f"close external vents to prevent water ingress."
        )

    if solar_level == "HIGH":
        alerts.append("HIGH_SOLAR")
        actions.append("activate_shading")
        insights.append(
            f"Solar radiation peaks at {max_solar} W/m² — "
            f"engage shade systems or reduce LED supplement to save energy."
        )

    # If no alerts, the weather is friendly
    if not alerts:
        insights.append(
            "Weather conditions are favorable. "
            "No pre-emptive adjustments required."
        )

    # --- Build the hourly breakdown (for dashboard charts) ---
    hourly_data = []
    for i in range(min(24, len(times))):
        hourly_data.append({
            "time": times[i] if i < len(times) else None,
            "temp_c": temps[i] if i < len(temps) else None,
            "humidity_pct": humids[i] if i < len(humids) else None,
            "precip_prob": precip[i] if i < len(precip) else None,
            "solar_w_m2": (
                (direct_rad[i] if i < len(direct_rad) else 0)
                + (diffuse_rad[i] if i < len(diffuse_rad) else 0)
            ),
        })

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": {"lat": lat, "lon": lon},
        "forecast_24h": {
            "max_temp_c": round(max_temp, 1),
            "max_humidity_pct": round(max_humidity, 1),
            "max_precip_prob": round(max_precip, 1),
            "max_solar_w_m2": round(max_solar, 1),
            "avg_solar_w_m2": round(avg_solar, 1),
            "solar_level": solar_level,
        },
        "alerts": alerts,
        "actions": actions,
        "insights": insights,
        "hourly": hourly_data,
    }


# ---------------------------------------------------------------------------
# 4. Fallback: Demo forecast data (used when offline)
# ---------------------------------------------------------------------------
def _demo_forecast(lat, lon):
    """
    Return realistic demo data so the system never crashes.
    This is critical for hackathon presentations with unreliable WiFi!
    """
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": {"lat": lat, "lon": lon},
        "forecast_24h": {
            "max_temp_c": 32.5,
            "max_humidity_pct": 84.0,
            "max_precip_prob": 45.0,
            "max_solar_w_m2": 720.0,
            "avg_solar_w_m2": 380.0,
            "solar_level": "MODERATE",
        },
        "alerts": ["HIGH_HUMIDITY", "HIGH_TEMP"],
        "actions": ["increase_fan_speed", "activate_cooling"],
        "insights": [
            "⚠️ [DEMO MODE] Humidity forecast to reach 84% — "
            "pre-activate exhaust fans tonight to prevent mold.",
            "⚠️ [DEMO MODE] External temperature expected to hit 32.5°C — "
            "increase cooling system power to protect crops.",
        ],
        "hourly": [
            {"time": "2026-05-05T00:00", "temp_c": 27.0, "humidity_pct": 78.0,
             "precip_prob": 10.0, "solar_w_m2": 0.0},
            {"time": "2026-05-05T06:00", "temp_c": 26.5, "humidity_pct": 82.0,
             "precip_prob": 20.0, "solar_w_m2": 150.0},
            {"time": "2026-05-05T12:00", "temp_c": 32.5, "humidity_pct": 70.0,
             "precip_prob": 45.0, "solar_w_m2": 720.0},
            {"time": "2026-05-05T18:00", "temp_c": 29.0, "humidity_pct": 84.0,
             "precip_prob": 30.0, "solar_w_m2": 50.0},
        ],
        "_demo_mode": True,
    }
