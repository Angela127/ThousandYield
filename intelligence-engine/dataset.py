"""
dataset.py — Data Loading, Cleaning, and Baseline Calculation

This module is the "Memory" of the Intelligence Engine.
It loads the historical IoT dataset, renames columns to standard names,
calculates statistical baselines (mean, std, normal ranges), and
discovers correlations between sensors and actuators for the simulator.

Used by:
  - app.py → GET /api/baseline
  - forecast.py → time-series data for SARIMA
  - simulator.py → correlation coefficients for What-If
"""

import os
import sys
import json
sys.stdout.reconfigure(encoding="utf-8")
import pandas as pd
import numpy as np


# ---------------------------------------------------------------------------
# Path Configuration
# ---------------------------------------------------------------------------
# If you want to keep the dataset on your local laptop but OUTSIDE this repo,
# change this to an absolute path, e.g., "C:\\Users\\Me\\Downloads\\IoTData.csv"
# Otherwise, keep it as None to look in the same folder as this script.
CUSTOM_CSV_PATH = None

# Directory where pre-trained stats are stored
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

# ---------------------------------------------------------------------------
# Column rename map: original CSV names → our standard names
# ---------------------------------------------------------------------------
RENAME_MAP = {
    "pH":           "ph",
    "TDS":          "ec_level",
    "water_level":  "water_level",
    "DHT_temp":     "temp_c",
    "DHT_humidity": "humidity_pct",
    "water_temp":   "water_temp_c",
}

# Columns we care about for baselines (numeric sensor readings)
SENSOR_COLS = ["ph", "ec_level", "temp_c", "humidity_pct", "water_temp_c"]

# Actuator columns (ON/OFF states from the dataset)
ACTUATOR_COLS = ["pH_reducer", "add_water", "nutrients_adder", "humidifier", "ex_fan"]


# ---------------------------------------------------------------------------
# 1. Load and Clean
# ---------------------------------------------------------------------------
def load_and_clean(csv_path=None):
    """
    Load data from the team's historical_24h.json and prepare it for analysis.
    """
    # Path to the team's JSON file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "..", "src", "data", "historical_24h.json")

    # Safety check: does the file exist?
    if not os.path.exists(json_path):
        print(f"⚠️  Team dataset not found at: {json_path}")
        return None

    # Load the JSON
    with open(json_path, "r") as f:
        raw_data = json.load(f)
    
    # Flatten the JSON structure
    rows = []
    for entry in raw_data:
        room = entry.get("room_data", {})
        ambient = room.get("ambient_sensors", {})
        # Use first rack for global metrics
        rack = room.get("racks", [{}])[0]
        rack_sensors = rack.get("rack_sensors", {})
        
        rows.append({
            "timestamp": pd.to_datetime(room.get("timestamp")),
            "temp_c": ambient.get("temp"),
            "humidity_pct": ambient.get("humidity"),
            "ph": rack_sensors.get("ph"),
            "ec_level": (rack_sensors.get("ec_mscmn") or 0) * 1000, # Convert mS to TDS-like scale
            "water_temp_c": ambient.get("temp", 0) - 2 # Approximation
        })

    df = pd.DataFrame(rows)
    print(f"✅ Loaded {len(df)} records from team JSON")

    if not df.empty:
        df = df.sort_values("timestamp").reset_index(drop=True)
        print(f"   Time range: {df['timestamp'].min()} → {df['timestamp'].max()}")

    return df


# ---------------------------------------------------------------------------
# 2. Calculate Baselines (Mean ± 2*StdDev)
# ---------------------------------------------------------------------------
def calculate_baselines(df=None):
    """
    Calculate the "Normal Ranges" for each sensor from historical data.

    Uses Mean ± 2 * Standard Deviation to define what "normal" looks like
    for THIS specific farm setup (not generic textbook values).

    Returns:
      dict like:
      {
        "ph": { "mean": 5.73, "std": 0.16, "normal_min": 5.41, "normal_max": 6.05 },
        ...
      }
    """
    # If no dataframe provided, try to load from saved file (Teammate Mode)
    if df is None:
        model_path = os.path.join(MODEL_DIR, "baselines.json")
        if os.path.exists(model_path):
            try:
                with open(model_path, 'r') as f:
                    print("✅ Loading baselines from pre-trained model")
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Failed to load saved baselines: {e}")
        
        return _demo_baselines()

    baselines = {}
    for col in SENSOR_COLS:
        if col not in df.columns:
            continue

        mean_val = float(df[col].mean())
        std_val = float(df[col].std())

        baselines[col] = {
            "mean": round(mean_val, 2),
            "std": round(std_val, 2),
            "normal_min": round(mean_val - 2 * std_val, 2),
            "normal_max": round(mean_val + 2 * std_val, 2),
        }

    print(f"✅ Baselines calculated for {len(baselines)} sensors")
    return baselines


# ---------------------------------------------------------------------------
# 3. Get Correlations (for the Simulator)
# ---------------------------------------------------------------------------
def get_correlations(df=None):
    """
    Discover how actuators affect sensor readings.

    Example output:
      { "ex_fan → temp_c": -0.45 }  means turning on the fan reduces temperature.

    These coefficients power the What-If Simulator.

    Returns:
      dict of { "actuator → sensor": correlation_value }
    """
    # If no dataframe provided, try to load from saved file (Teammate Mode)
    if df is None:
        model_path = os.path.join(MODEL_DIR, "correlations.json")
        if os.path.exists(model_path):
            try:
                with open(model_path, 'r') as f:
                    print("✅ Loading correlations from pre-trained model")
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Failed to load saved correlations: {e}")

        return _demo_correlations()

    correlations = {}
    for actuator in ACTUATOR_COLS:
        if actuator not in df.columns:
            continue
        for sensor in SENSOR_COLS:
            if sensor not in df.columns:
                continue

            # Calculate Pearson correlation between actuator state and sensor value
            corr = df[actuator].corr(df[sensor])
            if not np.isnan(corr):
                key = f"{actuator} → {sensor}"
                correlations[key] = round(float(corr), 4)

    print(f"✅ Discovered {len(correlations)} actuator-sensor correlations")
    return correlations


# ---------------------------------------------------------------------------
# 4. Get Latest Reading (last row of dataset)
# ---------------------------------------------------------------------------
def get_latest_reading(df=None):
    """
    Return the most recent sensor reading from the dataset.
    Used by /api/insights to check current state.

    Returns:
      dict like { "ph": 5.8, "temp_c": 24.5, ... }
    """
    if df is None:
        return _demo_latest()

    last_row = df.iloc[-1]
    reading = {}
    for col in SENSOR_COLS + ["water_level"]:
        if col in last_row:
            reading[col] = float(last_row[col])

    return reading


# ---------------------------------------------------------------------------
# 5. Get Time-Series for SARIMA
# ---------------------------------------------------------------------------
def get_time_series(df, column, resample_freq="15min"):
    """
    Extract a clean time-series from the dataset for SARIMA modeling.
    15min is best for IoT data with frequent actuator changes.

    Steps:
      1. Set timestamp as the index.
      2. Resample to hourly frequency (fill gaps with forward-fill).
      3. Return a pandas Series ready for statsmodels.

    Args:
      df: the cleaned dataframe
      column: which sensor to extract (e.g., "temp_c")
      resample_freq: resampling frequency

    Returns:
      pandas Series with datetime index
    """
    if df is None or column not in df.columns or "timestamp" not in df.columns:
        return None

    ts = df.set_index("timestamp")[column]
    # Resample to consistent intervals and fill any gaps
    ts = ts.resample(resample_freq).mean().ffill().bfill()

    return ts


# ---------------------------------------------------------------------------
# 6. Get Chart Data (for Recharts)
# ---------------------------------------------------------------------------
def get_chart_data(df, limit=24):
    """
    Extract the last X hourly averages and format them for Recharts.
    """
    if df is None or "timestamp" not in df.columns:
        return []

    # 1. Set timestamp as index for resampling
    df_ts = df.set_index("timestamp")
    
    # 2. Resample to hourly averages
    # This combines minute-by-minute data into 1-hour chunks
    hourly = df_ts.resample('1h').mean().ffill().tail(limit).reset_index()
    
    chart_data = []
    for _, row in hourly.iterrows():
        entry = {
            "time": row["timestamp"].strftime("%H:00"), # Show hour only
            "temp": round(float(row["temp_c"]), 1) if "temp_c" in row and not pd.isna(row["temp_c"]) else 0,
            "humidity": round(float(row["humidity_pct"]), 1) if "humidity_pct" in row and not pd.isna(row["humidity_pct"]) else 0,
            "ph": round(float(row["ph"]), 2) if "ph" in row and not pd.isna(row["ph"]) else 0,
            "ec": round(float(row["ec_level"]), 0) if "ec_level" in row and not pd.isna(row["ec_level"]) else 0,
            "water_temp": round(float(row["water_temp_c"]), 1) if "water_temp_c" in row and not pd.isna(row["water_temp_c"]) else 0,
        }
        chart_data.append(entry)
        
    return chart_data


# ---------------------------------------------------------------------------
# Demo / Fallback Data (used when CSV is not available)
# ---------------------------------------------------------------------------
def _demo_baselines():
    """Hardcoded baselines based on typical hydroponics values."""
    return {
        "ph":           {"mean": 5.73, "std": 0.16, "normal_min": 5.41, "normal_max": 6.05},
        "ec_level":     {"mean": 1184, "std": 220,  "normal_min": 744,  "normal_max": 1624},
        "temp_c":       {"mean": 25.2, "std": 1.5,  "normal_min": 22.2, "normal_max": 28.2},
        "humidity_pct": {"mean": 68.5, "std": 5.0,  "normal_min": 58.5, "normal_max": 78.5},
        "water_temp_c": {"mean": 21.0, "std": 1.2,  "normal_min": 18.6, "normal_max": 23.4},
    }


def _demo_correlations():
    """Hardcoded correlations for demo mode."""
    return {
        "ex_fan → temp_c":       -0.35,
        "ex_fan → humidity_pct": -0.28,
        "humidifier → humidity_pct": 0.42,
        "add_water → water_temp_c":  -0.15,
        "pH_reducer → ph":          -0.50,
        "nutrients_adder → ec_level": 0.38,
    }


def _demo_latest():
    """Hardcoded latest reading for demo mode."""
    return {
        "ph": 5.8,
        "ec_level": 1150,
        "temp_c": 25.0,
        "humidity_pct": 65.0,
        "water_temp_c": 21.5,
        "water_level": 2.0,
    }
