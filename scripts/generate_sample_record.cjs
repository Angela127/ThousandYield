const fs = require('fs');
const path = require('path');

const cropTypes = ['Lettuce', 'Spinach', 'Kale', 'Basil', 'Arugula'];
const now = new Date().toISOString();

const racks = [];
for (let row = 1; row <= 2; row++) {
  for (let col = 1; col <= 20; col++) {
    const prefix = String(row).padStart(2, '0');
    const rackNum = String(col).padStart(2, '0');
    const rackId = `rack_${prefix}${rackNum}`;
    const cropType = cropTypes[(row - 1) * 20 + col % cropTypes.length % cropTypes.length] || cropTypes[(col - 1) % cropTypes.length];
    const baseLight = 10000 + Math.round(Math.random() * 2500);
    const ph = parseFloat((5.65 + Math.random() * 0.5).toFixed(2));
    const ec = parseFloat((1.3 + Math.random() * 0.35).toFixed(2));
    const water = parseFloat((82 + Math.random() * 13).toFixed(1));

    const plants = [];
    for (let p = 1; p <= 40; p++) {
      const plantId = `plant${prefix}${rackNum}${String(p).padStart(2, '0')}`;
      const laiBase = 2.0 + (p / 40) * 1.2 + Math.random() * 0.15;
      const health = Math.random() > 0.05 ? 95 + Math.random() * 4.5 : 78 + Math.random() * 7;
      const plant = {
        plant_id: plantId,
        lai_val: parseFloat(laiBase.toFixed(2)),
        health_score: parseFloat(health.toFixed(1)),
      };
      if (Math.random() < 0.08) {
        plant.ai_detected_anomaly = 'Early Tipburn Detected';
      }
      plants.push(plant);
    }

    racks.push({
      rack_id: rackId,
      crop_type: cropType,
      rack_sensors: {
        ph,
        ec_mscmn: ec,
        water_level_pct: water,
        light_intensity_lux: baseLight
      },
      rack_controllers: {
        led_power_pct: 80,
        nutrient_pump: Math.random() > 0.5 ? 'ON' : 'OFF',
        pesticide_sprayer: 'OFF',
        concentration_controller_status: 'Balanced'
      },
      plants
    });
  }
}

const record = {
  room_data: {
    timestamp: now,
    ambient_sensors: {
      temp: parseFloat((25.8 + Math.random() * 2.5).toFixed(1)),
      humidity: parseFloat((60 + Math.random() * 10).toFixed(1))
    },
    global_actuators: {
      ac_units: [
        { id: 'ac_unit_01', status: 'ON', temp: 22 },
        { id: 'ac_unit_02', status: 'OFF', temp: 24 }
      ],
      fan_units: [
        { id: 'fan_unit_01', status: 'ON', speed_level: 3 },
        { id: 'fan_unit_02', status: 'ON', speed_level: 2 }
      ],
      sprayer_units: [
        { id: 'sprayer_01', status: 'OFF' },
        { id: 'sprayer_02', status: 'OFF' }
      ],
      light_intensity: [
        { id: 'light_01', status: 'ON', level: 80 },
        { id: 'light_02', status: 'ON', level: 75 }
      ],
      pesticide_sprayer: { id: 'pest_sprayer_01', status: 'OFF' }
    },
    resource_trackers: {
      total_electricity_kwh: parseFloat((45 + Math.random() * 6).toFixed(2)),
      total_water_litres: parseFloat((120 + Math.random() * 10).toFixed(2)),
      total_fertilizer_ml: parseFloat((500 + Math.random() * 40).toFixed(1)),
      total_pesticide_ml: 0
    },
    racks
  }
};

fs.writeFileSync(path.join(__dirname, '../src/data/sample_record.json'), JSON.stringify(record, null, 2));
console.log('Generated sample_record.json with', racks.length, 'racks.');
