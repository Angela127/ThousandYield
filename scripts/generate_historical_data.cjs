const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const CROPS = ["Lettuce", "Spinach", "Kale", "Basil", "Arugula"];

const generateHistoricalData = () => {
  const dataPoints = [];
  const now = new Date();
  const startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));

  let totalElec = 40.0;
  let totalWater = 100.0;

  for (let i = 0; i < 288; i++) {
    const timestamp = new Date(startTime.getTime() + (i * 5 * 60 * 1000));
    const hour = timestamp.getHours();
    
    const tempFactor = Math.sin((hour - 8) * Math.PI / 12); 
    const ambientTemp = parseFloat((24 + (tempFactor * 4) + (Math.random() * 0.5)).toFixed(1));
    const ambientHumid = parseFloat((65 - (tempFactor * 10) + (Math.random() * 2)).toFixed(1));
    
    let isDay = hour >= 7 && hour <= 19;
    let lightLevel = isDay ? Math.floor(Math.sin((hour - 7) * Math.PI / 12) * 100) : 0;

    const acStatus = ambientTemp > 25.5 ? "ON" : "OFF";
    const fanSpeed = ambientTemp > 24 ? 3 : 1;

    totalElec += acStatus === "ON" ? 0.35 : 0.15; // More racks = more power
    totalWater += 1.2; // More racks = more water

    const record = {
      "room_data": {
        "timestamp": timestamp.toISOString(),
        "ambient_sensors": {
          "temp": ambientTemp,
          "humidity": ambientHumid
        },
        "global_actuators": {
          "ac_units": [
            {"id": "ac_unit_01", "status": acStatus, "temp": 22.0},
            {"id": "ac_unit_02", "status": acStatus, "temp": 23.0}
          ],
          "fan_units": [
            {"id": "fan_unit_01", "status": "ON", "speed_level": fanSpeed},
            {"id": "fan_unit_02", "status": "ON", "speed_level": fanSpeed}
          ],
          "sprayer_units": [
            {"id": "sprayer_01", "status": ambientHumid < 50 ? "ON" : "OFF"},
            {"id": "sprayer_02", "status": ambientHumid < 50 ? "ON" : "OFF"}
          ],
          "light_intensity": [
            {"id": "light_01", "status": lightLevel > 0 ? "ON" : "OFF", "level": lightLevel},
            {"id": "light_02", "status": lightLevel > 0 ? "ON" : "OFF", "level": lightLevel}
          ]
        },
        "resource_trackers": {
          "total_electricity_kwh": parseFloat(totalElec.toFixed(2)),
          "total_water_litres": parseFloat(totalWater.toFixed(2)),
          "total_fertilizer_ml": parseFloat((2500 + (i * 15)).toFixed(1)),
          "total_pesticide_ml": 0.0
        },
        "racks": []
      }
    };

    // Generate 40 Racks
    for (let r = 1; r <= 40; r++) {
      const rackId = `rack_${r.toString().padStart(4, '0')}`;
      const cropType = CROPS[r % CROPS.length];
      const lightLux = isDay ? (lightLevel * 200) + (Math.random() * 50) : 0;

      const rackData = {
        "rack_id": rackId,
        "crop_type": cropType,
        "rack_sensors": {
          "ph": parseFloat((5.8 + (Math.random() * 0.4 - 0.2)).toFixed(2)),
          "ec_mscmn": parseFloat((1.4 + (Math.random() * 0.2 - 0.1)).toFixed(2)),
          "water_level_pct": parseFloat((80 + (Math.random() * 15)).toFixed(1)),
          "light_intensity_lux": parseFloat(lightLux.toFixed(0))
        },
        "rack_controllers": {
          "nutrient_pump": i % 12 === 0 ? "ON" : "OFF",
          "concentration_controller_status": "Balanced"
        },
        "plants": []
      };

      // 10 Plants per rack
      for (let p = 1; p <= 10; p++) {
        const plantIdx = p.toString().padStart(2, '0');
        const growthFactor = (i / 288) * 0.05;
        const plant = {
          "plant_id": `plant${rackId.replace('rack_', '')}${plantIdx}`,
          "lai_val": parseFloat((2.0 + growthFactor + (Math.random() * 0.1)).toFixed(2))
        };
        if (Math.random() > 0.05) {
          plant.health_score = parseFloat((95 + (Math.random() * 5)).toFixed(1));
        }
        rackData.plants.push(plant);
      }

      record.room_data.racks.push(rackData);
    }

    if (i % 48 === 0) {
      record.room_data.global_actuators.pesticide_sprayer = { "id": "pest_sprayer_01", "status": "OFF" };
    }
    if (i % 12 === 0) {
       record.room_data.ambient_sensors.forecast_trend = tempFactor > 0 ? "Rising" : "Falling";
    }

    dataPoints.push(record);
  }
  return dataPoints;
};

async function uploadHistoricalData() {
  try {
    console.log("Generating 288 records with 40 RACKS EACH (Total 11,520 racks)...");
    const dataPoints = generateHistoricalData();
    
    console.log("Uploading to Firebase Firestore...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const collectionRef = collection(db, "telemetry");

    // Break into chunks of 50 for stability (Firestore limit is 500 per batch, but large docs take memory)
    const chunkSize = 50;
    for (let i = 0; i < dataPoints.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = dataPoints.slice(i, i + chunkSize);
      chunk.forEach((point) => {
        const newDocRef = doc(collectionRef);
        batch.set(newDocRef, point);
      });
      await batch.commit();
      console.log(`Uploaded chunk ${Math.floor(i / chunkSize) + 1}...`);
    }

    console.log("SUCCESS: Room expanded to 40 racks and uploaded!");
    process.exit(0);
  } catch (err) {
    console.error("FAILED to upload expanded room data:", err);
    process.exit(1);
  }
}

uploadHistoricalData();
