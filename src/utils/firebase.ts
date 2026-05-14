import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// NOTE: Please replace these placeholder values with your actual Firebase Web App config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAQmkKhLyvi3vRIrLFF9C0XX51aD7VNjhY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "librory-pp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "librory-pp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "librory-pp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "544626907795",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:544626907795:web:549ad4f52da50abeb90b66",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6XVECK6KCR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
