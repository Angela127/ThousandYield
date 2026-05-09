const fs = require('fs');
const path = require('path');

const generatePlants = (rackId, count) => {
  const plants = [];
  for (let i = 1; i <= count; i++) {
    const plantIndex = i.toString().padStart(2, '0');
    const plant = {
      "plant_id": `plant${rackId.replace('rack_', '')}${plantIndex}`,
      "lai_val": parseFloat((1.5 + Math.random() * 3).toFixed(2)), // Leaf Area Index
      "health_score": parseFloat((95 + Math.random() * 5).toFixed(1))
    };
    
    // ai_detected_anomaly is optional
    if (Math.random() > 0.2) {
      plant.ai_detected_anomaly = "None";
    }
    
    plants.push(plant);
  }
  return plants;
};

const sampleRecord = {
  "room_data": {
    "timestamp": new Date().toISOString(),
    "ambient_sensors": {
      "temp": 26.4,
      "humidity": 62.1
      // forecast_trend is optional (added below if needed)
    },
    "global_actuators": {
      "ac_units": [
        {"id": "ac_unit_01", "status": "ON", "temp": 22.0},
        {"id": "ac_unit_02", "status": "OFF", "temp": 24.0}
      ],
      "fan_units": [
        {"id": "fan_unit_01", "status": "ON", "speed_level": 3},
        {"id": "fan_unit_02", "status": "ON", "speed_level": 2}
      ]
    },
    "resource_trackers": {
      "total_electricity_kwh": 45.8,
      "total_water_litres": 120.5,
      "total_fertilizer_ml": 500.0,
      "total_pesticide_ml": 0.0
    },
    "racks": [
      {
        "rack_id": "rack_0101",
        "crop_type": "Lettuce",
        "rack_sensors": {
          "ph": 5.8,
          "ec_mscmn": 1.4,
          "water_level_pct": 88.5,
          "light_intensity_lux": 11500 
        },
        "rack_controllers": {
          "led_power_pct": 80,
          "nutrient_pump": "OFF",
          "pesticide_sprayer": "OFF",
          "concentration_controller_status": "Balanced"
        },
        "plants": generatePlants("rack_0101", 40)
      }
    ]
  }
};

// Add optional forecast_trend
if (Math.random() > 0.3) {
  sampleRecord.room_data.ambient_sensors.forecast_trend = "Steady";
}

const outputPath = path.join(__dirname, '../src/data/sample_record.json');

try {
  fs.writeFileSync(outputPath, JSON.stringify(sampleRecord, null, 2));
  console.log(`Successfully regenerated final structure sample at: ${outputPath}`);
} catch (error) {
  console.error('Error generating sample record:', error);
}
