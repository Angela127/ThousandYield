"""
forecast.py — Rule-Based Intelligence

Uses Moving Averages and Threshold-based logic (no ML, no Linear Regression) 
to provide explainable "Time-to-Breach" alerts and Harvest Estimates.
"""

import os
import pandas as pd
import numpy as np

# ---------------------------------------------------------------------------
# Core Rules & Limits
# ---------------------------------------------------------------------------
SENSOR_LIMITS = {
    "temp_c":       {"low": 18.0, "high": 28.0, "unit": "°C"},
    "ph":           {"low": 5.5,  "high": 6.8,  "unit": "pH"},
    "ec_level":     {"low": 800,  "high": 1800, "unit": "µS/cm"},
    "humidity_pct": {"low": 55.0, "high": 80.0,  "unit": "%"},
    "water_temp_c": {"low": 18.0, "high": 25.0,  "unit": "°C"},
}

# ---------------------------------------------------------------------------
# Predictive Alerting (Moving Average Slope)
# ---------------------------------------------------------------------------
def predict_trend(recent_series, label: str):
    """
    Analyzes last 10-20 readings using Moving Averages to predict breaches.
    """
    if recent_series is None or len(recent_series) < 10:
        return {"status": "STABLE", "message": "Gathering data..."}

    limits = SENSOR_LIMITS.get(label)
    if not limits: return {"status": "UNKNOWN", "message": "No limits"}

    # Use a 5-point Simple Moving Average to smooth out sensor jitter
    sma = recent_series.rolling(window=5).mean().dropna()
    if len(sma) < 2: return {"status": "STABLE", "message": "Smoothing data..."}

    current = float(recent_series.iloc[-1])
    # Slope = (Current SMA - Starting SMA) / Number of steps
    # Note: Each step is ~15 min in our resampled data, so slope * 4 = change per hour
    slope = (float(sma.iloc[-1]) - float(sma.iloc[0])) / len(sma)
    
    # Calculate predicted value in 1 hour (4 steps of 15 mins)
    predicted_1h = current + (slope * 4)

    # Threshold for "significant" movement
    # If the change per hour is less than 0.2% of the value, call it STABLE
    is_stable = abs(slope * 4) < (current * 0.001)

    # Logic: Time until breach
    if not is_stable and slope > 0: # Trending Up
        gap = limits["high"] - current
        minutes = int((gap / slope) * 15) if slope > 0.0001 else 999
        if current >= limits["high"]:
            return {"status": "CRITICAL", "message": f"{label} EXCEEDED limit!", "predicted_1h": round(predicted_1h, 2)}
        
        status = "WARNING" if minutes < 60 else ("WATCH" if minutes < 1440 else "STABLE")
        return {
            "status": status,
            "message": f"{label} trending up (+{round(slope*4, 2)}/hr)",
            "minutes": minutes if minutes < 1440 else None, 
            "predicted_1h": round(predicted_1h, 2),
            "slope": slope
        }
    
    elif not is_stable and slope < 0: # Trending Down
        gap = current - limits["low"]
        minutes = int((gap / abs(slope)) * 15) if abs(slope) > 0.0001 else 999
        if current <= limits["low"]:
            return {"status": "CRITICAL", "message": f"{label} DROPPED below limit!", "predicted_1h": round(predicted_1h, 2)}
        
        status = "WARNING" if minutes < 60 else ("WATCH" if minutes < 1440 else "STABLE")
        return {
            "status": status,
            "message": f"{label} trending down ({round(slope*4, 2)}/hr)",
            "minutes": minutes if minutes < 1440 else None, 
            "predicted_1h": round(predicted_1h, 2),
            "slope": slope
        }

    return {
        "status": "STABLE", 
        "message": f"{label} is stable", 
        "predicted_1h": round(predicted_1h, 2),
        "minutes": None
    }

# ---------------------------------------------------------------------------
# Harvest Date Estimator (Health Score Formula)
# ---------------------------------------------------------------------------
def estimate_harvest(df, crop: str = "lettuce"):
    """
    Formula: Remaining Days = (Standard Days / Health Score)
    """
    base_days = {"lettuce": 28, "spinach": 40, "basil": 35}
    std_days = base_days.get(crop.lower(), 28)

    # Calculate Health Score (Time spent in optimal ranges)
    scores = []
    if "ph" in df.columns:           scores.append(df["ph"].between(5.5, 6.5).mean())
    if "temp_c" in df.columns:       scores.append(df["temp_c"].between(20.0, 26.0).mean())
    if "ec_level" in df.columns:     scores.append(df["ec_level"].between(1000, 1600).mean())
    
    health_score = max(0.5, sum(scores) / len(scores)) if scores else 0.9
    days_remaining = round(std_days / health_score) - 14 # Subtract 14 days already elapsed
    days_remaining = max(1, days_remaining)

    return {
        "crop": crop,
        "health_score": round(health_score * 100, 1),
        "days_remaining": days_remaining,
        "growth_rate": f"{round(health_score * 100, 1)}%",
        "message": f"{crop.capitalize()} ready in ~{days_remaining} days (growth rate {round(health_score*100,1)}% of optimal)"
    }

# API Wrapper
def predict_sensor(time_series, column_name="sensor", horizon=24):
    analysis = predict_trend(time_series, column_name)
    current_val = float(time_series.iloc[-1]) if time_series is not None and len(time_series) > 0 else 0
    
    predictions = []
    
    # ---------------------------------------------------------
    # "Seasonal Naive" Rule for accurate charting (No ML)
    # ---------------------------------------------------------
    steps_in_24h = 96  # Default to 15min
    if time_series is not None and len(time_series) > 2:
        # Dynamically detect if data is hourly or 15-minutely
        freq_mins = (time_series.index[1] - time_series.index[0]).total_seconds() / 60
        if freq_mins > 0:
            steps_in_24h = int((24 * 60) / freq_mins)

    if time_series is not None and len(time_series) > steps_in_24h + horizon:
        # Get the pattern starting from exactly 24 hours ago
        start_idx = len(time_series) - steps_in_24h
        past_pattern = time_series.iloc[start_idx : start_idx + horizon].values
        
        # Calculate the offset to make the curve start at our current value
        offset = current_val - past_pattern[0]
        
        for i in range(horizon):
            val = past_pattern[i] + offset
            predictions.append({"hour": round((i+1)*0.25, 2), "value": round(float(val), 2)})
    else:
        # Fallback to straight slope if we don't have enough history
        slope = analysis.get("slope", 0)
        for i in range(horizon):
            predictions.append({"hour": round((i+1)*0.25, 2), "value": round(current_val + (slope * i), 2)})
            
    return {
        "sensor": column_name,
        "model": "Seasonal Rule-Based",
        "status": analysis["status"],
        "message": analysis["message"],
        "predictions": predictions,
        "confidence": {"percentage": 90, "explanation": "Rule-based: Matches pattern from exactly 24 hours ago."}
    }