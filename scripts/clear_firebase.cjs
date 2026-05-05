const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function clearTelemetry() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const collectionRef = collection(db, "telemetry");
    const snapshot = await getDocs(collectionRef);

    console.log(`Found ${snapshot.size} documents. Starting deletion...`);
    
    const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, "telemetry", document.id)));
    await Promise.all(deletePromises);

    console.log("SUCCESS: All telemetry data cleared from Firebase.");
    process.exit(0);
  } catch (err) {
    console.error("FAILED to clear data:", err);
    process.exit(1);
  }
}

clearTelemetry();
