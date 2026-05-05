import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBTUsBQxuCBlrNxJhJPSOdkCo2h_WisdKc",
  authDomain: "thousandyield-2d787.firebaseapp.com",
  projectId: "thousandyield-2d787",
  storageBucket: "thousandyield-2d787.firebasestorage.app",
  messagingSenderId: "989757604289",
  appId: "1:989757604289:web:41bbadf7de187121b3ef40",
  measurementId: "G-5EV2RFQWBB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in other files
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
