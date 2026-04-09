import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxKLS56jZbzHEmhY9G9OimfnaWPZL5asA",
  authDomain: "disaster-response-b3c9e.firebaseapp.com",
  projectId: "disaster-response-b3c9e",
  storageBucket: "disaster-response-b3c9e.firebasestorage.app",
  messagingSenderId: "492224588635",
  appId: "1:492224588635:web:2633c2ac13550127a9487e",
  measurementId: "G-NGF4XZFV6D"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);