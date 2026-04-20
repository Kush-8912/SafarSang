// Firebase configuration and initialization
// Replace the firebaseConfig values with your own from the Firebase Console:
// https://console.firebase.google.com → Your Project → Project Settings → Your Apps → Web App

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ IMPORTANT: Replace these values with your own Firebase config before deploying
const firebaseConfig = {
  apiKey: "AIzaSyBmCHOFbzLPVBx8xUzRTTfMtEdmRmJPZeE",
  authDomain: "safarsang-9e997.firebaseapp.com",
  projectId: "safarsang-9e997",
  // 💡 NOTE: If your storage upload fails/hangs, try changing the suffix below from
  // ".firebasestorage.app" to ".appspot.com" (used for projects created before Oct 2024).
  storageBucket: "safarsang-9e997.firebasestorage.app",
  messagingSenderId: "694259028890",
  appId: "1:694259028890:web:d87b493cd82803b876e023",
  measurementId: "G-N8YS8TQY2B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
