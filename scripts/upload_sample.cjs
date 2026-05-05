const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
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

async function uploadData() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Read the sample data
    const dataPath = path.join(__dirname, '../src/data/sample_record.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Upload to Firestore collection "telemetry"
    const docRef = await addDoc(collection(db, "telemetry"), data);
    console.log("Document written with ID: ", docRef.id);
    console.log("Successfully uploaded sample record to Firebase Firestore!");
    
    process.exit(0);
  } catch (e) {
    console.error("Error adding document: ", e);
    process.exit(1);
  }
}

uploadData();
