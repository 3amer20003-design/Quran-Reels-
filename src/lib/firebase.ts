import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Automatically injected by the AI Studio environment via set_up_firebase
// and available globally if metadata.json is correct, but since we are in Vite
// we might need to fetch the config or assume it's set in env if deployed.
// Let's rely on standard Vite env variables if provided, but AI Studio injects
// a firebase-applet-config.json file in the root if set_up_firebase was called!
// Let's fetch it at runtime or import it if Vite allows.

let app: any;
let auth: any;
let db: any;
let storage: any;

export async function initFirebase() {
  try {
    const res = await fetch('/firebase-applet-config.json');
    const config = await res.json();
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.warn("Firebase config not found, skipping init for now.", e);
  }
}

export { app, auth, db, storage };
