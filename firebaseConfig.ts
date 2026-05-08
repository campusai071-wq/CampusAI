
// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// @ts-ignore
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// @ts-ignore
import { getFirestore, doc, getDocFromServer } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import firebaseConfig from '../firebase-applet-config.json';

declare var process: any;

export const MASTER_CONFIG = {
  GEMINI_API_KEY: process.env.API_KEY || localStorage.getItem('campusai_gemini_key') || "", 
  FLUTTERWAVE_PUBLIC_KEY: process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "FLWPUBK-f26c5e3b665384b21c780ad1f752954e-X" || localStorage.getItem('campusai_flutterwave_key') || "",
  FIREBASE: firebaseConfig
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
