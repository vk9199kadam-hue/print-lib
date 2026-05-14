import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// NOTE: Please replace these placeholder values with your actual Firebase Web App config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9dggFyezi0O2jDqJGmJoH-NYMITEllD4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "librory-print02.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "librory-print02",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "librory-print02.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "777035826833",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:777035826833:web:0af69426daf3bb4e47e130",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QLL9BFKYDW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
