import { db } from '../services/dbService';
// @ts-ignore
import { doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedAnswer = async (query: string): Promise<string | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "cache", query);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Date.now() - data.createdAt.toMillis() < CACHE_TTL_MS) {
        return data.answer;
      }
    }
    return null;
  } catch (e) {
    console.error("Cache fetch error:", e);
    return null;
  }
};

export const saveToCache = async (query: string, answer: string) => {
  if (!db) return;
  try {
    await setDoc(doc(db, "cache", query), {
      answer,
      createdAt: Timestamp.now()
    });
  } catch (e) {
    console.error("Cache save error:", e);
  }
};
