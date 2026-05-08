import { db } from './dbService';
// @ts-ignore
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const saveTimetable = async (university: string, data: any) => {
  if (!db) return;
  await setDoc(doc(db, "timetables", university), {
    data,
    updatedAt: new Date()
  });
};

export const getTimetable = async (university: string) => {
  if (!db) return null;
  const snap = await getDoc(doc(db, "timetables", university));
  return snap.exists() ? snap.data().data : null;
};
