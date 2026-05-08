import { UserProfile, UserRole } from '../types';
import { db } from './firebaseConfig';
import { stringify } from './utils';
// @ts-ignore
import { doc, updateDoc, setDoc, collection, query, orderBy, limit, getDocs, Timestamp, getDoc, getCountFromServer, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const JOURNEY_KEY = 'campusai_journey_progress';
export const DAILY_LIMIT = 15;
export const QUOTA_KEY = 'campusai_user_profile'; // Using the existing profile key for consistency

export const isRealUser = (uid?: string) => {
  if (!uid) return false;
  return !uid.startsWith('local-') && !uid.startsWith('email-user-');
};

/**
 * Returns a strict YYYY-MM-DD key fixed to Nigerian Time (UTC+1)
 */
const getTodayKey = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
};

/**
 * ATOMIC LOCAL PROFILE RETRIEVAL
 */
export const getLocalProfile = (): UserProfile => {
  const today = getTodayKey();
  const stored = localStorage.getItem(QUOTA_KEY);
  
  if (stored) {
    try {
      const data = JSON.parse(stored) as UserProfile;
      if (data.last_active !== today) {
        const reset = { ...data, daily_requests: 0, last_active: today };
        localStorage.setItem(QUOTA_KEY, stringify(reset));
        return reset;
      }
      return data;
    } catch (e) {
      localStorage.removeItem(QUOTA_KEY);
    }
  }

  const newProfile: UserProfile = {
    uid: 'local-' + Math.random().toString(36).substr(2, 9),
    displayName: 'Scholar',
    role: 'Pre-Admission',
    last_active: today,
    daily_requests: 0,
    is_premium: false
  };
  localStorage.setItem(QUOTA_KEY, stringify(newProfile));
  return newProfile;
};

/**
 * CLOUD SYNCHRONIZATION ENGINE
 */
export const syncAndValidateProfile = async (uid: string): Promise<UserProfile> => {
  const local = getLocalProfile();

  if (!db || !isRealUser(uid)) return local;

  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const cloud = snap.exists() ? snap.data() : {};

    const merged: UserProfile = { 
      ...local, 
      ...cloud,
      uid: uid,
    };

    try {
      localStorage.setItem('campusai_user_profile', stringify(merged));
    } catch (e) {
      console.error("Failed to stringify merged profile:", merged);
      throw e;
    }
    return merged;
  } catch (e) {
    console.warn("Cloud sync deferred:", e);
    return local;
  }
};

export const initializeUserProfile = async (user?: any, role?: UserRole): Promise<UserProfile> => {
  if (user && isRealUser(user.uid)) {
    return await syncAndValidateProfile(user.uid);
  }
  return getLocalProfile();
};

export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile) => void) => {
  if (!db || !isRealUser(uid)) return () => {};
  return onSnapshot(doc(db, "users", uid), (snapshot: any) => {
    if (snapshot.exists()) {
      const cloudData = snapshot.data();
      
      const merged: UserProfile = {
        ...cloudData,
        uid: uid,
        last_active: cloudData.last_active || getTodayKey()
      };
      
      localStorage.setItem('campusai_user_profile', stringify(merged));
      callback(merged);
    }
  });
};

export const updateUserProfile = async (data: Partial<UserProfile>) => {
  const profile = getLocalProfile();
  const updated = { ...profile, ...data };
  localStorage.setItem(QUOTA_KEY, stringify(updated));
  if (db && isRealUser(profile.uid)) {
    try { await updateDoc(doc(db, "users", profile.uid), data); } catch (e) {}
  }
  return updated;
};

/**
 * PERSISTENT PROFILE MANAGEMENT
 */
export const saveUserProfile = async (userId: string, data: any) => {
  if (!db) return;
  try {
    await setDoc(doc(db, 'users', userId, 'profile', 'data'), data, { merge: true });
  } catch (e) {
    console.error("Error saving user profile:", e);
  }
};

export const getUserProfile = async (userId: string) => {
  if (!db) return null;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'data');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    console.error("Error fetching user profile:", e);
    return null;
  }
};

export const checkAndIncrementRequests = async (uid: string) => {
  const profile = getLocalProfile();
  if (profile.is_premium) return { allowed: true, currentRequests: profile.daily_requests || 0 };
  
  const currentRequests = profile.daily_requests || 0;
  if (currentRequests >= DAILY_LIMIT)
    return { allowed: false, currentRequests };

  const updated = { ...profile, daily_requests: currentRequests + 1 };
  localStorage.setItem(QUOTA_KEY, stringify(updated));
  
  if (db && isRealUser(uid)) {
    try {
      await updateDoc(doc(db, "users", uid), { daily_requests: updated.daily_requests, last_active: updated.last_active });
    } catch (e) {}
  }
  
  window.dispatchEvent(new CustomEvent('campusai_quota_updated', { detail: updated }));
  return { allowed: true, currentRequests: updated.daily_requests };
};

export const fetchRecentUsers = async (): Promise<UserProfile[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "users"), orderBy("last_active", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
  } catch (e) { return []; }
};

export const getTotalUserCount = async (): Promise<number> => {
  if (!db) return 0;
  try {
    const snap = await getCountFromServer(collection(db, "users"));
    return snap.data().count;
  } catch (e) { return 0; }
};

export const saveJourneyProgress = async (uid: string, progress: number[]) => {
  localStorage.setItem(JOURNEY_KEY, stringify(progress));
  if (db && isRealUser(uid)) {
    try { await updateDoc(doc(db, "users", uid), { journey_progress: progress }); } catch (e) {}
  }
};
