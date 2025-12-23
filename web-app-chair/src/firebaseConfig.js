// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// ถ้าใช้ Firestore, Realtime Database ฯลฯ ก็ import เพิ่ม
// import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqNn-MiVjkZm9-8OHb8AnVAOvanFSVYak",
  authDomain: "chair-f440c.firebaseapp.com",
  projectId: "chair-f440c",
  storageBucket: "chair-f440c.firebasestorage.app",
  messagingSenderId: "95934710137",
  appId: "1:95934710137:web:3aac02bbfdb8ee1bbfefa8",
  measurementId: "G-DY546W9T5G"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
// ถ้าใช้ Firestore
// export const db = getFirestore(app);

export default app;