"""
agri_logic.py — Agricultural Impact & Risk Intelligence

This is the "Expert Agronomist" of the system.
It converts raw sensor numbers into real-world agricultural outcomes:
  - Mold risk levels
  - Growth rate impacts
  - Yield loss estimates
  - Cost impact calculations

This is what separates FarmBrain from a simple data dashboard.
Judges don't care about "pH = 7.2" — they care about
"Yield will drop 15% due to nutrient lockout."

Used by:
  - app.py → GET /api/insights (impact layer)
  - simulator.py → What-If impact calculations
"""

import math


# ---------------------------------------------------------------------------
# Crop growth curves (simplified for lettuce / leafy greens)
# ---------------------------------------------------------------------------
# Optimal temperature range for lettuce growth
OPTIMAL_TEMP_MIN = 22.0   # °C
OPTIMAL_TEMP_MAX = 26.0   # °C
# Beyond these, growth drops sharply
CRITICAL_TEMP_MIN = 15.0
CRITICAL_TEMP_MAX = 35.0

# Optimal humidity for lettuce
OPTIMAL_HUMIDITY_MIN = 60.0   # %
OPTIMAL_HUMIDITY_MAX = 75.0   # %

# Optimal pH for nutrient absorption in hydroponics
OPTIMAL_PH_MIN = 5.5
OPTIMAL_PH_MAX = 6.5

# Electricity cost per kWh in Malaysia (RM)
ELECTRICITY_COST_RM = 0.218


# ---------------------------------------------------------------------------
# 1. Mold Risk Assessment (Vapor Pressure Deficit simplified)
# ---------------------------------------------------------------------------
def calc_mold_risk(temp_c, humidity_pct):
    """
    Calculate the risk of mold/fungal disease based on temperature and humidity.

    High humidity + warm temperature = perfect breeding ground for mold.
    We use a simplified VPD (Vapor Pressure Deficit) approach.

    Returns:
      dict with risk level, percentage, and explanation.
    """
    # Calculate a simple "mold index" (0-100)
    # Higher humidity and moderate-warm temps increase risk
    humidity_factor = max(0, (humidity_pct - 60) / 40) * 60   # 0-60 points
    temp_factor = 0

    if 20 <= temp_c <= 30:
        # This is the danger zone for mold
        temp_factor = (1 - abs(temp_c - 25) / 10) * 40  # peak at 25°C
    elif temp_c > 30:
        temp_factor = 20  # hot but drying, moderate risk

    mold_index = min(100, max(0, humidity_factor + temp_factor))

    # Classify risk level
    if mold_index > 70:
        level = "CRITICAL"
        message = (
            f"Mold risk is CRITICAL ({mold_index:.0f}%). "
            f"Temp {temp_c}°C and humidity {humidity_pct}% create ideal fungal conditions. "
            f"Immediate action: increase ventilation and reduce misting."
        )
    elif mold_index > 45:
        level = "HIGH"
        message = (
            f"Mold risk is HIGH ({mold_index:.0f}%). "
            f"Monitor closely and prepare to increase airflow."
        )
    elif mold_index > 20:
        level = "MODERATE"
        message = (
            f"Mold risk is moderate ({mold_index:.0f}%). "
            f"Conditions are within acceptable range."
        )
    else:
        level = "LOW"
        message = f"Mold risk is low ({mold_index:.0f}%). No action needed."

    return {
        "risk_level": level,
        "risk_index": round(mold_index, 1),
        "message": message,
    }


# ---------------------------------------------------------------------------
# 2. Growth Rate Impact
# ---------------------------------------------------------------------------
def calc_growth_impact(temp_c, humidity_pct=None, ph=None):
    """
    Estimate the impact on plant growth rate based on current conditions.

    Growth rate is modeled as a percentage of optimal:
      - 100% = perfect conditions → maximum growth
      - 50% = stressed conditions → half speed growth
      - 0% = lethal conditions → growth stops

    Returns:
      dict with growth_rate_pct and explanation.
    """
    # --- Temperature impact ---
    if OPTIMAL_TEMP_MIN <= temp_c <= OPTIMAL_TEMP_MAX:
        temp_growth = 100.0
    elif CRITICAL_TEMP_MIN <= temp_c < OPTIMAL_TEMP_MIN:
        # Cold stress: linear drop
        temp_growth = 100 * (temp_c - CRITICAL_TEMP_MIN) / (OPTIMAL_TEMP_MIN - CRITICAL_TEMP_MIN)
    elif OPTIMAL_TEMP_MAX < temp_c <= CRITICAL_TEMP_MAX:
        # Heat stress: linear drop
        temp_growth = 100 * (CRITICAL_TEMP_MAX - temp_c) / (CRITICAL_TEMP_MAX - OPTIMAL_TEMP_MAX)
    else:
        # Beyond critical thresholds
        temp_growth = 0.0

    # --- pH impact (nutrient lockout) ---
    ph_growth = 100.0
    nutrient_lockout = False
    if ph is not None:
        if OPTIMAL_PH_MIN <= ph <= OPTIMAL_PH_MAX:
            ph_growth = 100.0
        elif 4.5 <= ph < OPTIMAL_PH_MIN:
            ph_growth = 100 * (ph - 4.5) / (OPTIMAL_PH_MIN - 4.5)
            nutrient_lockout = True
        elif OPTIMAL_PH_MAX < ph <= 8.0:
            ph_growth = 100 * (8.0 - ph) / (8.0 - OPTIMAL_PH_MAX)
            nutrient_lockout = True
        else:
            ph_growth = 10.0  # Extremely bad
            nutrient_lockout = True

    # --- Combined growth rate ---
    # Take the minimum — the weakest link limits growth
    growth_rate = min(temp_growth, ph_growth)
    growth_rate = max(0, round(growth_rate, 1))

    # --- Build explanation ---
    parts = []
    if temp_growth < 100:
        deficit = round(100 - temp_growth, 1)
        if temp_c < OPTIMAL_TEMP_MIN:
            parts.append(f"Cold stress: growth reduced by {deficit}%")
        else:
            parts.append(f"Heat stress: growth reduced by {deficit}%")

    if nutrient_lockout:
        ph_deficit = round(100 - ph_growth, 1)
        parts.append(f"Nutrient lockout (pH {ph}): absorption reduced by {ph_deficit}%")

    if not parts:
        explanation = "All conditions optimal — maximum growth rate."
    else:
        explanation = "; ".join(parts) + "."

    return {
        "growth_rate_pct": growth_rate,
        "yield_change_pct": round(growth_rate - 100, 1),
        "nutrient_lockout": nutrient_lockout,
        "explanation": explanation,
    }


# ---------------------------------------------------------------------------
# 3. Cost Impact Estimation
# ---------------------------------------------------------------------------
def calc_cost_impact(actuator_changes):
    """
    Estimate the electricity cost change (in RM) when actuators are adjusted.

    Rough power consumption estimates for vertical farm equipment:
      - LED lights: ~100W per rack
      - Exhaust fan: ~50W
      - Water pump: ~30W
      - Cooling system: ~200W
      - Humidifier: ~40W

    Args:
      actuator_changes: dict like { "fan_speed": +20, "light_intensity": -10 }
                        Values are % changes from current settings.

    Returns:
      dict with estimated daily cost change (RM).
    """
    # Power consumption per actuator (Watts at 100%)
    POWER_MAP = {
        "fan_speed": 50,
        "light_intensity": 100,
        "pump_speed": 30,
        "cooling_power": 200,
        "humidifier_power": 40,
    }

    total_watts_change = 0
    breakdown = []

    for actuator, pct_change in actuator_changes.items():
        base_watts = POWER_MAP.get(actuator, 50)  # default 50W
        watts_change = base_watts * (pct_change / 100)
        total_watts_change += watts_change
        breakdown.append({
            "actuator": actuator,
            "change_pct": pct_change,
            "watts_change": round(watts_change, 1),
        })

    # Convert to daily kWh cost
    daily_kwh_change = (total_watts_change * 24) / 1000
    daily_cost_rm = daily_kwh_change * ELECTRICITY_COST_RM

    return {
        "daily_watts_change": round(total_watts_change, 1),
        "daily_kwh_change": round(daily_kwh_change, 3),
        "daily_cost_change_rm": round(daily_cost_rm, 2),
        "monthly_cost_change_rm": round(daily_cost_rm * 30, 2),
        "breakdown": breakdown,
    }


# ---------------------------------------------------------------------------
# 4. Risk Score (composite farm health)
# ---------------------------------------------------------------------------
def calc_risk_score(anomalies, weather_alerts, predictions=None):
    """
    Calculate a composite Risk Score (0-100) for the farm.

    Weighting:
      - Current anomalies: 40%
      - Weather forecast alerts: 30%
      - Predicted future state: 30%

    0-25: GREEN (all good)
    26-50: YELLOW (monitor closely)
    51-75: ORANGE (action needed)
    76-100: RED (critical intervention required)
    """
    # --- Anomaly score (0-40) ---
    num_anomalies = len(anomalies) if anomalies else 0
    anomaly_score = min(40, num_anomalies * 10)

    # --- Weather score (0-30) ---
    num_weather = len(weather_alerts) if weather_alerts else 0
    weather_score = min(30, num_weather * 10)

    # --- Prediction score (0-30) ---
    prediction_score = 0
    if predictions:
        for pred in predictions:
            trend = pred.get("trend", {})
            delta = abs(trend.get("delta", 0))
            confidence = pred.get("confidence", {}).get("percentage", 50)
            # Higher delta with higher confidence = more worry
            prediction_score += (delta * confidence / 100) * 5
    prediction_score = min(30, prediction_score)

    # --- Total ---
    total = round(anomaly_score + weather_score + prediction_score, 1)
    total = min(100, total)

    # Classify
    if total <= 25:
        level = "GREEN"
        status = "HEALTHY"
        summary = "Farm conditions are excellent. No action needed."
    elif total <= 50:
        level = "YELLOW"
        status = "MONITOR"
        summary = "Minor issues detected. Monitor closely."
    elif total <= 75:
        level = "ORANGE"
        status = "WARNING"
        summary = "Significant issues detected. Immediate attention recommended."
    else:
        level = "RED"
        status = "CRITICAL"
        summary = "Critical conditions. Urgent intervention required."

    return {
        "score": total,
        "level": level,
        "status": status,
        "summary": summary,
        "breakdown": {
            "anomaly_score": round(anomaly_score, 1),
            "weather_score": round(weather_score, 1),
            "prediction_score": round(prediction_score, 1),
        },
    }
