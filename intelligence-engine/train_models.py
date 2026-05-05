"""
train_models.py — Farm Statistics Generator

This script calculates the "Normal Ranges" (Baselines) and 
"Sensor Relationships" (Correlations) from your 25K row dataset.

These are saved to the /models folder so your teammates get 
real farm intelligence without needing the raw CSV.
"""

import os
import json
import dataset

# Directory where pre-calculated stats are stored
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

def generate_farm_stats():
    # 1. Create models directory if it doesn't exist
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

    # 2. Load the real dataset
    df = dataset.load_and_clean()
    if df is None:
        print("❌ Error: CSV dataset not found. Cannot calculate farm stats.")
        return

    print(f"✅ Loaded dataset: {len(df)} rows")

    # 3. Save Baselines (The "Normal" for your farm)
    print(f"\n📊 Calculating Normal Operating Ranges...")
    baselines = dataset.calculate_baselines(df)
    with open(os.path.join(MODEL_DIR, "baselines.json"), 'w') as f:
        json.dump(baselines, f, indent=2)
    print("   Saved baselines.json")

    # 4. Save Correlations (How actuators affect sensors)
    print(f"📊 Calculating Actuator-to-Sensor relationships...")
    correlations = dataset.get_correlations(df)
    with open(os.path.join(MODEL_DIR, "correlations.json"), 'w') as f:
        json.dump(correlations, f, indent=2)
    print("   Saved correlations.json")

    print("\n✅ Intelligence Engine Primed!")
    print("   Commit the 'models/' folder to GitHub for your teammates.")

if __name__ == "__main__":
    generate_farm_stats()
