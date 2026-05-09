import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTUsBQxuCBlrNxJhJPSOdkCo2h_WisdKc",
  authDomain: "thousandyield-2d787.firebaseapp.com",
  projectId: "thousandyield-2d787",
  storageBucket: "thousandyield-2d787.firebasestorage.app",
  messagingSenderId: "989757604289",
  appId: "1:989757604289:web:41bbadf7de187121b3ef40",
  measurementId: "G-5EV2RFQWBB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CROP_TYPES = ['Lettuce', 'Spinach', 'Kale', 'Basil', 'Arugula'];

const generateData = async () => {
  console.log("Starting data generation for one room (40 racks: 0101-0120 and 0201-0220)...");
  
  const now = new Date();
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  // Round helper
  const r2 = (num) => Math.round(num * 100) / 100;

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(startTime.getTime() + i * 60 * 60 * 1000);
    const hour = timestamp.getHours();
    
    // Diurnal light cycle: peak at 12pm
    const lightBase = Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 12000);
    const light = lightBase > 0 ? lightBase + (Math.random() - 0.5) * 500 : 0;

    const racks = [];
    // Generating 40 racks: Row 1 (0101-0120) and Row 2 (0201-0220)
    for (let row = 1; row <= 2; row++) {
      for (let col = 1; col <= 20; col++) {
        const rackId = `rack_${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}`;
        const cropType = CROP_TYPES[(col - 1) % CROP_TYPES.length];
        
        const plants = [];
        for (let p = 1; p <= 40; p++) {
          const plantId = `plant${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}${String(p).padStart(2, '0')}`;
          const hasAnomaly = Math.random() > 0.98;
          
          plants.push({
            plant_id: plantId,
            health_score: r2(hasAnomaly ? 70 + Math.random() * 15 : 95 + Math.random() * 5),
            lai_val: r2(2.1 + (i / 24) * 0.4 + Math.random() * 0.1),
            ai_detected_anomaly: hasAnomaly ? 'Early Tipburn Detected' : 'None'
          });
        }
        
        racks.push({
          rack_id: rackId,
          crop_type: cropType,
          rack_sensors: {
            ph: r2(5.8 + Math.random() * 0.4),
            ec_mscmn: r2(1.4 + Math.random() * 0.2),
            water_level_pct: r2(88 + Math.random() * 7),
            light_intensity_lux: Math.round(light)
          },
          rack_controllers: {
            nutrient_pump: 'ON',
            led_power_pct: r2(light > 0 ? 80 : 0),
            concentration_controller_status: 'Balanced',
            pesticide_sprayer: 'OFF'
          },
          plants: plants
        });
      }
    }
    
    const docData = {
      room_data: {
        timestamp: timestamp.toISOString(),
        ambient_sensors: {
          temp: r2(22 + Math.sin((hour - 6) * Math.PI / 12) * 5 + Math.random()),
          humidity: r2(60 - Math.sin((hour - 6) * Math.PI / 12) * 10 + Math.random() * 5)
        },
        global_actuators: {
          sprayer_units: [
            { id: 'sprayer_01', status: 'OFF' },
            { id: 'sprayer_02', status: 'OFF' }
          ],
          light_intensity: Array.from({ length: 12 }, (_, idx) => ({
            id: `light_${String(idx + 1).padStart(2, '0')}`,
            status: light > 0 ? 'ON' : 'OFF',
            level: r2(light > 0 ? 80 + Math.random() * 10 : 0)
          })),
          ac_units: [
            { id: 'ac_01', status: 'ON', temp: 24 },
            { id: 'ac_02', status: 'ON', temp: 24 }
          ],
          fan_units: [
            { id: 'fan_01', status: 'ON', speed_level: 3 },
            { id: 'fan_02', status: 'ON', speed_level: 3 }
          ]
        },
        resource_trackers: {
          total_electricity_kwh: r2(120 + i * 5.2),
          total_water_litres: r2(450 + i * 15.5),
          total_fertilizer_ml: r2(1200 + i * 40.2),
          total_pesticide_ml: r2(200 + i * 5.1)
        },
        racks: racks
      }
    };
    
    try {
      await addDoc(collection(db, "telemetry"), docData);
      console.log(`Progress: ${i+1}/24 documents uploaded...`);
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  console.log("Successfully seeded 24 hours of data to Firebase.");
  process.exit(0);
};

generateData();
