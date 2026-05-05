"""
anomaly.py — Hybrid Anomaly Detection Engine

This module checks live sensor readings against two layers:
  1. Historical Baseline (Mean ± 2*StdDev) → "Statistical Warning"
  2. Hard Safety Bounds → "Critical Alert"

The dual-layer approach shows judges that you understand:
  - Data-driven thresholds (not just textbook values)
  - Safety-critical limits (the plant dies if pH hits 9.0)

Used by:
  - app.py → POST /api/anomaly
  - app.py → GET /api/insights (current state check)
"""


# ---------------------------------------------------------------------------
# Hard Safety Bounds (absolute limits — never exceeded)
# ---------------------------------------------------------------------------
SAFETY_BOUNDS = {
    "ph":           (4.0, 8.0),     # Plants die outside this
    "ec_level":     (200, 3000),    # Equipment damage / nutrient burn
    "temp_c":       (10.0, 40.0),   # Lethal for most crops
    "humidity_pct": (20.0, 98.0),   # Equipment / condensation issues
    "water_temp_c": (5.0, 35.0),    # Root shock / algae growth
}

# Default "textbook" valid ranges (used when historical baseline is unavailable)
DEFAULT_RANGES = {
    "ph":           (5.5, 6.8),
    "ec_level":     (1000, 1800),
    "temp_c":       (22.0, 28.0),
    "humidity_pct": (60.0, 80.0),
    "water_temp_c": (18.0, 24.0),
}


# ---------------------------------------------------------------------------
# 1. Check Anomalies (main function)
# ---------------------------------------------------------------------------
def check_anomalies(reading, baselines=None):
    """
    Check a set of live sensor readings for anomalies.

    This function performs a TWO-LAYER check:
      Layer 1 — Statistical: Is the value outside (Mean ± 2*StdDev)?
                → Status: "STAT_HIGH" or "STAT_LOW" (Warning)
      Layer 2 — Safety: Is the value outside the hard safety bounds?
                → Status: "CRITICAL_HIGH" or "CRITICAL_LOW" (Alert)

    Special case: water_level
      → 1.0 = LOW (alert), 2.0 = OK (no alert)

    Args:
      reading: dict like { "ph": 7.2, "temp_c": 29.5, ... }
      baselines: dict from dataset.calculate_baselines()
                 If None, falls back to DEFAULT_RANGES.

    Returns:
      dict with:
        - "anomalies": list of detected issues
        - "all_normal": True/False
        - "checked_sensors": how many sensors were checked
    """
    anomalies = []
    checked = 0

    for sensor, value in reading.items():
        # --- Special case: water_level (binary sensor) ---
        if sensor == "water_level":
            checked += 1
            if value == 1.0:
                anomalies.append({
                    "sensor": "water_level",
                    "value": value,
                    "status": "WATER_LOW",
                    "severity": "CRITICAL",
                    "expected": "2.0 (OK)",
                    "message": (
                        "⚠️ Water reservoir is LOW! "
                        "Refill immediately to prevent pump damage and crop dehydration."
                    ),
                })
            continue

        # --- Skip sensors we don't monitor ---
        if sensor not in SAFETY_BOUNDS:
            continue

        checked += 1

        # --- Get the thresholds ---
        safety_min, safety_max = SAFETY_BOUNDS[sensor]

        # Use historical baseline if available, otherwise default ranges
        if baselines and sensor in baselines:
            stat_min = baselines[sensor]["normal_min"]
            stat_max = baselines[sensor]["normal_max"]
        elif sensor in DEFAULT_RANGES:
            stat_min, stat_max = DEFAULT_RANGES[sensor]
        else:
            continue

        # --- Layer 2: Safety bounds check (most severe) ---
        if value > safety_max:
            anomalies.append({
                "sensor": sensor,
                "value": value,
                "status": "CRITICAL_HIGH",
                "severity": "CRITICAL",
                "expected": f"{safety_min} – {safety_max}",
                "message": _build_message(sensor, value, "CRITICAL_HIGH", safety_max),
            })
        elif value < safety_min:
            anomalies.append({
                "sensor": sensor,
                "value": value,
                "status": "CRITICAL_LOW",
                "severity": "CRITICAL",
                "expected": f"{safety_min} – {safety_max}",
                "message": _build_message(sensor, value, "CRITICAL_LOW", safety_min),
            })
        # --- Layer 1: Statistical baseline check (less severe) ---
        elif value > stat_max:
            anomalies.append({
                "sensor": sensor,
                "value": value,
                "status": "STAT_HIGH",
                "severity": "WARNING",
                "expected": f"{stat_min} – {stat_max}",
                "message": _build_message(sensor, value, "STAT_HIGH", stat_max),
            })
        elif value < stat_min:
            anomalies.append({
                "sensor": sensor,
                "value": value,
                "status": "STAT_LOW",
                "severity": "WARNING",
                "expected": f"{stat_min} – {stat_max}",
                "message": _build_message(sensor, value, "STAT_LOW", stat_min),
            })

    return {
        "anomalies": anomalies,
        "all_normal": len(anomalies) == 0,
        "checked_sensors": checked,
        "total_anomalies": len(anomalies),
    }


# ---------------------------------------------------------------------------
# 2. Build Human-Readable Messages
# ---------------------------------------------------------------------------
def _build_message(sensor, value, status, threshold):
    """
    Generate a clear, human-readable message for each anomaly.
    These messages will be displayed directly on the dashboard.
    """
    # Friendly sensor names for display
    FRIENDLY_NAMES = {
        "ph":           "Water pH",
        "ec_level":     "Nutrient concentration (EC)",
        "temp_c":       "Air temperature",
        "humidity_pct": "Ambient humidity",
        "water_temp_c": "Water temperature",
    }

    # Units for display
    UNITS = {
        "ph":           "",
        "ec_level":     " µS/cm",
        "temp_c":       "°C",
        "humidity_pct": "%",
        "water_temp_c": "°C",
    }

    name = FRIENDLY_NAMES.get(sensor, sensor)
    unit = UNITS.get(sensor, "")

    if status == "CRITICAL_HIGH":
        return (
            f"🚨 CRITICAL: {name} is dangerously high at {value}{unit} "
            f"(safety limit: {threshold}{unit}). Immediate intervention required!"
        )
    elif status == "CRITICAL_LOW":
        return (
            f"🚨 CRITICAL: {name} is dangerously low at {value}{unit} "
            f"(safety limit: {threshold}{unit}). Immediate intervention required!"
        )
    elif status == "STAT_HIGH":
        return (
            f"⚠️ WARNING: {name} is above normal at {value}{unit} "
            f"(historical upper bound: {threshold}{unit}). Monitor closely."
        )
    elif status == "STAT_LOW":
        return (
            f"⚠️ WARNING: {name} is below normal at {value}{unit} "
            f"(historical lower bound: {threshold}{unit}). Monitor closely."
        )
    else:
        return f"{name} = {value}{unit}"
