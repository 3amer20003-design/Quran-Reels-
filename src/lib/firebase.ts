import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import configJson from "../../firebase-applet-config.json";

// Direct embedded configuration as fallback and Vite bundle target
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || configJson.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || configJson.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || configJson.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || configJson.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || configJson.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || configJson.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || configJson.measurementId,
};

let app: any;
let auth: any;
let db: any;
let storage: any;

// Eagerly initialize Firebase so auth and db are ready immediately
try {
  if (firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (e) {
  console.warn("Eager Firebase initialization failed:", e);
}

export async function initFirebase(): Promise<boolean> {
  try {
    if (!app) {
      let config = firebaseConfig;
      if (!config.apiKey) {
        const res = await fetch('/firebase-applet-config.json');
        config = await res.json();
      }
      app = !getApps().length ? initializeApp(config) : getApp();
    }
    if (!auth) auth = getAuth(app);
    if (!db) db = getFirestore(app);
    if (!storage) storage = getStorage(app);
    return true;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return false;
  }
}

export { app, auth, db, storage };
