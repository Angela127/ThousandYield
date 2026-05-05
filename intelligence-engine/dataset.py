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
    Load the CSV file and prepare it for analysis.

    Steps:
      1. Find the CSV file (default: same directory as this script).
      2. Rename columns to standard names.
      3. Parse the 'timestamp' column into datetime objects.
      4. Sort by timestamp so time-series analysis works correctly.

    Returns:
      pandas DataFrame with cleaned data, or None if file not found.
    """
    # Use custom path if provided, otherwise look for default file in script dir
    if csv_path is None:
        if CUSTOM_CSV_PATH:
            csv_path = CUSTOM_CSV_PATH
        else:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(script_dir, "IoTData_25K_without_interpolation.csv")

    # Safety check: does the file exist?
    if not os.path.exists(csv_path):
        print(f"⚠️  Dataset not found at: {csv_path}")
        print("   The system will use demo baselines instead.")
        return None

    # Load the CSV
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded dataset: {len(df)} rows, {len(df.columns)} columns")

    # Rename columns to our standard names
    df = df.rename(columns=RENAME_MAP)

    # Convert actuator strings ('ON'/'OFF') to numbers (1/0)
    for col in ACTUATOR_COLS:
        if col in df.columns:
            df[col] = df[col].map({'ON': 1, 'OFF': 0, 'TRUE': 1, 'FALSE': 0, 1: 1, 0: 0})
            # Fill any missing values with 0
            df[col] = df[col].fillna(0).astype(int)

    # Parse timestamp into datetime (try multiple formats)
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
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
