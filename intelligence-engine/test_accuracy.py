"""
test_accuracy.py — SARIMA Model Backtesting & Accuracy Report

This script evaluates how accurate the SARIMA model is by:
  1. Loading the dataset (real CSV or synthetic demo)
  2. Splitting into TRAIN (all except last 24h) and TEST (last 24h)
  3. Training SARIMA on the training set
  4. Predicting the test period
  5. Comparing predictions vs actual values
  6. Calculating error metrics: MAE, RMSE, MAPE, R²

Run with:
  python test_accuracy.py

Output:
  - Prints a detailed accuracy report to the console
  - Saves a PNG chart of Actual vs Predicted (if matplotlib is installed)
"""

import sys
sys.stdout.reconfigure(encoding="utf-8")

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Import our modules
import dataset
import forecast


# ---------------------------------------------------------------------------
# 1. Generate Synthetic Dataset (used when real CSV is not available)
# ---------------------------------------------------------------------------
def generate_synthetic_data(hours=720):
    """
    Generate 30 days (720 hours) of realistic hydroponic sensor data.

    The data includes:
      - Day/night temperature cycles (24h period)
      - Humidity inversely correlated with temperature
      - Random noise to simulate real sensor fluctuations
      - Occasional anomalies (temperature spikes)

    This allows us to test the model even without the real CSV.
    """
    print("   Generating synthetic hydroponic dataset...")
    np.random.seed(42)  # Reproducible results

    timestamps = [datetime(2026, 4, 1) + timedelta(hours=i) for i in range(hours)]

    # Temperature: 24h sinusoidal cycle (cooler at night, warmer during day)
    # Base temp: 25°C, amplitude: 2°C, noise: ±0.5°C
    temp = 25 + 2 * np.sin(2 * np.pi * np.arange(hours) / 24 - np.pi/2) + \
           np.random.normal(0, 0.5, hours)

    # Humidity: inversely related to temperature + independent noise
    # Base humidity: 68%, drops when temp is high
    humidity = 68 - 1.5 * (temp - 25) + np.random.normal(0, 1.5, hours)

    # pH: slow drift with small noise
    ph = 5.8 + 0.3 * np.sin(2 * np.pi * np.arange(hours) / 168) + \
         np.random.normal(0, 0.05, hours)

    # EC level: slight daily cycle
    ec = 1200 + 100 * np.sin(2 * np.pi * np.arange(hours) / 48) + \
         np.random.normal(0, 30, hours)

    # Water temperature: smoother, slower cycle
    water_temp = 21 + 1.0 * np.sin(2 * np.pi * np.arange(hours) / 24 - np.pi/3) + \
                 np.random.normal(0, 0.3, hours)

    # Add a few anomalies (temperature spikes) to test robustness
    spike_indices = [150, 300, 500]
    for idx in spike_indices:
        temp[idx:idx+3] += 5  # 5°C spike for 3 hours

    df = pd.DataFrame({
        "timestamp": timestamps,
        "ph": np.round(ph, 2),
        "ec_level": np.round(ec, 1),
        "temp_c": np.round(temp, 2),
        "humidity_pct": np.round(humidity, 2),
        "water_temp_c": np.round(water_temp, 2),
        "water_level": [2.0] * hours,  # All OK
    })

    print(f"   Generated {hours} hours of synthetic data")
    return df


# ---------------------------------------------------------------------------
# 2. Backtest SARIMA Model
# ---------------------------------------------------------------------------
def backtest_sensor(df, sensor_name, test_hours=24):
    """
    Backtest the SARIMA model on a single sensor.

    Steps:
      1. Extract time-series for the sensor
      2. Split: train = everything except last `test_hours`, test = last `test_hours`
      3. Train SARIMA on the training set
      4. Predict `test_hours` steps ahead
      5. Compare predictions vs actual values
      6. Calculate error metrics

    Returns:
      dict with metrics and data for plotting
    """
    print(f"\n{'='*60}")
    print(f"   BACKTESTING: {sensor_name}")
    print(f"{'='*60}")

    # Get the full time-series
    ts = dataset.get_time_series(df, sensor_name, resample_freq="1h")

    if ts is None or len(ts) < 48:
        print(f"   ERROR: Not enough data for {sensor_name}")
        return None

    # Split into train and test
    train = ts[:-test_hours]
    actual = ts[-test_hours:]

    print(f"   Train size: {len(train)} hours")
    print(f"   Test size:  {len(actual)} hours")
    print(f"   Last train value: {train.iloc[-1]:.2f}")

    # Run SARIMA prediction
    result = forecast.predict_sensor(train, column_name=sensor_name, horizon=test_hours)

    if result["model"] == "Fallback":
        print(f"   WARNING: Model fell back to defaults. Cannot evaluate accuracy.")
        return None

    # Extract predicted values
    predicted = [p["value"] for p in result["predictions"]]
    actual_values = actual.values[:len(predicted)]

    # Trim to matching length
    n = min(len(predicted), len(actual_values))
    predicted = np.array(predicted[:n])
    actual_values = np.array(actual_values[:n])

    # --- Calculate Error Metrics ---
    errors = actual_values - predicted
    abs_errors = np.abs(errors)

    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    mape = float(np.mean(abs_errors / np.abs(actual_values)) * 100) if np.all(actual_values != 0) else 0
    
    # R² (Coefficient of Determination)
    ss_res = np.sum(errors ** 2)
    ss_tot = np.sum((actual_values - np.mean(actual_values)) ** 2)
    r_squared = float(1 - (ss_res / ss_tot)) if ss_tot != 0 else 0

    # Direction accuracy (did we predict the trend direction correctly?)
    if n > 1:
        actual_dirs = np.sign(np.diff(actual_values))
        pred_dirs = np.sign(np.diff(predicted))
        direction_accuracy = float(np.mean(actual_dirs == pred_dirs) * 100)
    else:
        direction_accuracy = 0

    metrics = {
        "sensor": sensor_name,
        "model": "Rule-Based Trend",
        "test_hours": n,
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mape": round(mape, 2),
        "r_squared": round(r_squared, 4),
        "direction_accuracy": round(direction_accuracy, 1),
        "confidence": result["confidence"]["percentage"],
    }

    # --- Print Results ---
    print(f"\n   Model Used: Rule-Based Trend")
    print(f"   Confidence: {result['confidence']['percentage']}%")
    print(f"   {result['confidence']['explanation']}")
    print(f"\n   --- Accuracy Metrics ---")
    print(f"   MAE  (Mean Absolute Error):    {mae:.4f}")
    print(f"   RMSE (Root Mean Square Error):  {rmse:.4f}")
    print(f"   MAPE (Mean Abs % Error):        {mape:.2f}%")
    print(f"   R²   (Coefficient of Determ.):  {r_squared:.4f}")
    print(f"   Direction Accuracy:             {direction_accuracy:.1f}%")

    # --- Interpret Results ---
    print(f"\n   --- Interpretation ---")
    if mape < 5:
        print(f"   EXCELLENT: MAPE < 5% — Model predictions are highly accurate.")
    elif mape < 10:
        print(f"   GOOD: MAPE < 10% — Model is reasonably accurate for farm decisions.")
    elif mape < 20:
        print(f"   FAIR: MAPE < 20% — Useful for trend detection but individual values may vary.")
    else:
        print(f"   POOR: MAPE > 20% — Model needs tuning or more training data.")

    if r_squared > 0.8:
        print(f"   R² > 0.8 — Model explains most of the variance in the data.")
    elif r_squared > 0.5:
        print(f"   R² > 0.5 — Model captures the general trend.")
    else:
        print(f"   R² < 0.5 — Model struggles to capture the pattern. Consider more data or tuning.")

    # --- Hour-by-hour comparison table ---
    print(f"\n   --- Hour-by-Hour Comparison (first 12 hours) ---")
    print(f"   {'Hour':<6} {'Actual':<12} {'Predicted':<12} {'Error':<12} {'% Error':<10}")
    print(f"   {'-'*52}")
    for i in range(min(12, n)):
        pct_err = abs(errors[i] / actual_values[i] * 100) if actual_values[i] != 0 else 0
        marker = " <<<" if pct_err > 10 else ""
        print(f"   {i+1:<6} {actual_values[i]:<12.2f} {predicted[i]:<12.2f} {errors[i]:<12.2f} {pct_err:<10.2f}{marker}")

    return {
        **metrics,
        "actual": actual_values.tolist(),
        "predicted": predicted.tolist(),
        "train_tail": train.values[-48:].tolist(),  # last 48h of training for chart context
    }


# ---------------------------------------------------------------------------
# 3. Generate Chart (if matplotlib is available)
# ---------------------------------------------------------------------------
def generate_chart(results, output_path="accuracy_report.png"):
    """
    Create a visual chart showing Actual vs Predicted for each sensor.
    Saves as a PNG image.
    """
    try:
        import matplotlib
        matplotlib.use("Agg")  # Non-interactive backend
        import matplotlib.pyplot as plt
    except ImportError:
        print("\n   matplotlib not installed. Skipping chart generation.")
        print("   Install with: pip install matplotlib")
        return

    valid_results = [r for r in results if r is not None]
    if not valid_results:
        print("   No valid results to chart.")
        return

    fig, axes = plt.subplots(len(valid_results), 1, figsize=(14, 5 * len(valid_results)))
    if len(valid_results) == 1:
        axes = [axes]

    colors = {
        "temp_c": ("#ef4444", "#fca5a5"),
        "humidity_pct": ("#3b82f6", "#93c5fd"),
        "ph": ("#22c55e", "#86efac"),
        "ec_level": ("#f59e0b", "#fcd34d"),
        "water_temp_c": ("#8b5cf6", "#c4b5fd"),
    }

    for idx, result in enumerate(valid_results):
        ax = axes[idx]
        sensor = result["sensor"]
        actual = result["actual"]
        predicted = result["predicted"]
        train_tail = result["train_tail"]

        color_main, color_light = colors.get(sensor, ("#64748b", "#cbd5e1"))

        # Plot training data context (last 48h)
        train_x = list(range(-len(train_tail), 0))
        ax.plot(train_x, train_tail, color="#475569", linewidth=1, alpha=0.5, label="Training Data (last 48h)")

        # Plot actual test values
        test_x = list(range(1, len(actual) + 1))
        ax.plot(test_x, actual, color=color_main, linewidth=2, marker="o", markersize=4, label="Actual")

        # Plot predicted values
        ax.plot(test_x, predicted, color=color_light, linewidth=2, linestyle="--", marker="s", markersize=4, label="Predicted")

        # Fill error region
        ax.fill_between(test_x, actual, predicted, alpha=0.15, color=color_main)

        # Vertical line at train/test split
        ax.axvline(x=0.5, color="#64748b", linestyle=":", alpha=0.5)
        ax.text(0.5, ax.get_ylim()[1], " Test Start", fontsize=8, color="#64748b", va="top")

        # Labels
        ax.set_title(
            f"{sensor}  |  MAE={result['mae']:.3f}  RMSE={result['rmse']:.3f}  MAPE={result['mape']:.1f}%",
            fontsize=11, fontweight="bold", color="#e2e8f0"
        )
        ax.set_xlabel("Hours", fontsize=9, color="#94a3b8")
        ax.set_ylabel(sensor, fontsize=9, color="#94a3b8")
        ax.legend(fontsize=8, loc="upper left")
        ax.grid(True, alpha=0.15)

        # Dark theme
        ax.set_facecolor("#1a1f2e")
        ax.tick_params(colors="#64748b", labelsize=8)
        for spine in ax.spines.values():
            spine.set_color("#2a3142")

    fig.patch.set_facecolor("#0f1117")
    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0f1117")
    print(f"\n   Chart saved to: {output_path}")


# ---------------------------------------------------------------------------
# 4. Main — Run Everything
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  FarmBrain — Intelligence Engine Accuracy Test")
    print("=" * 60)

    # Try to load real CSV, fall back to synthetic
    df = dataset.load_and_clean()
    data_source = "REAL DATASET"

    if df is None:
        print("\n   No CSV found. Using SYNTHETIC data for backtesting.")
        print("   (Add IoTData_25K_without_interpolation.csv for real results)")
        df = generate_synthetic_data(hours=720)  # 30 days
        data_source = "SYNTHETIC DATA"

    print(f"\n   Data Source: {data_source}")
    print(f"   Total Rows: {len(df)}")

    # 1. Backtest each sensor for Trend-to-Breach accuracy
    sensors_to_test = ["temp_c", "humidity_pct", "ph", "ec_level", "water_temp_c"]
    results = []
    for sensor in sensors_to_test:
        results.append(backtest_sensor(df, sensor, test_hours=24))

    # 2. Test Harvest Date Estimator (Your 3rd Requirement)
    print("\n" + "=" * 60)
    print("   TESTING: Harvest Date Estimator")
    print("=" * 60)
    harvest = forecast.estimate_harvest(df, "lettuce")
    print(f"   Crop: {harvest['crop'].capitalize()}")
    print(f"   Health Score: {harvest['health_score']}%")
    print(f"   Prediction: {harvest['message']}")

    # --- Summary Table ---
    valid = [r for r in results if r is not None]
    if valid:
        print(f"\n\n{'='*60}")
        print(f"  ACCURACY SUMMARY ({data_source})")
        print(f"{'='*60}")
        print(f"  {'Sensor':<16} {'Model':<10} {'MAE':<10} {'RMSE':<10} {'MAPE %':<10} {'R²':<10} {'Dir.Acc %':<10}")
        print(f"  {'-'*76}")
        for r in valid:
            print(f"  {r['sensor']:<16} {r['model']:<10} {r['mae']:<10.4f} {r['rmse']:<10.4f} {r['mape']:<10.2f} {r['r_squared']:<10.4f} {r['direction_accuracy']:<10.1f}")

        avg_mape = np.mean([r["mape"] for r in valid])
        avg_r2 = np.mean([r["r_squared"] for r in valid])
        print(f"  {'-'*76}")
        print(f"  {'AVERAGE':<16} {'':10} {'':10} {'':10} {avg_mape:<10.2f} {avg_r2:<10.4f}")

        print(f"\n  Overall Assessment:")
        if avg_mape < 5:
            print(f"  EXCELLENT — Average MAPE {avg_mape:.1f}% indicates high prediction accuracy.")
        elif avg_mape < 10:
            print(f"  GOOD — Average MAPE {avg_mape:.1f}% is suitable for automated farm decisions.")
        elif avg_mape < 20:
            print(f"  FAIR — Average MAPE {avg_mape:.1f}% is useful for trend detection.")
        else:
            print(f"  NEEDS IMPROVEMENT — Average MAPE {avg_mape:.1f}% suggests model tuning is needed.")

    # Generate chart
    chart_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "accuracy_report.png")
    generate_chart(results, output_path=chart_path)

    print(f"\n{'='*60}")
    print(f"  Test Complete!")
    print(f"{'='*60}\n")
