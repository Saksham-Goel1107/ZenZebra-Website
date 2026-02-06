// firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// --- Firebase configuration (matches your console exactly) ---
const firebaseConfig = {
  apiKey: "AIzaSyCuiJa6uNt9os8uHWcfdrt7p5IMCDjFtDo",
  authDomain: "zenzebra-website.firebaseapp.com",
  databaseURL: "https://zenzebra-website-default-rtdb.firebaseio.com",
  projectId: "zenzebra-website",
  storageBucket: "zenzebra-website.firebasestorage.app", // ✅ exact bucket name
  messagingSenderId: "745689009145",
  appId: "1:745689009145:web:72683a8d5ac241d673cb28",
};

// --- Initialize once ---
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Export services ---
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
