
import { NewsItem, BillboardAd, Comment, BroadcastEmail, ChatMessage } from '../types';
import { MOCK_NEWS, TICKER_HEADLINES } from '../constants';
import { db } from './firebaseConfig';
export { db };
import { slugify, stringify } from './utils';
// @ts-ignore
// @ts-ignore
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, setDoc, Timestamp, where, updateDoc, getDoc, limit, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const NEWS_KEY = 'campusai_published_news';

/**
 * Ticker Headlines Logic
 */
export const getTickerHeadlines = async (): Promise<string[]> => {
  if (!db) return TICKER_HEADLINES;
  try {
    const snap = await getDoc(doc(db, "settings", "ticker"));
    return snap.exists() ? snap.data().headlines : TICKER_HEADLINES;
  } catch (e) {
    return TICKER_HEADLINES;
  }
};

export const saveTickerHeadlines = async (headlines: string[]) => {
  if (!db) return;
  await setDoc(doc(db, "settings", "ticker"), { headlines, updatedAt: Timestamp.now() });
};

export const getGlobalSyncMetadata = async (): Promise<{ lastSync: number }> => {
  if (!db) return { lastSync: 0 };
  try {
    const snap = await getDoc(doc(db, "settings", "sync"));
    return snap.exists() ? { lastSync: snap.data().lastSync || 0 } : { lastSync: 0 };
  } catch (e) {
    return { lastSync: 0 };
  }
};

export const updateGlobalSyncMetadata = async (lastSync: number) => {
  if (!db) return;
  try {
    await setDoc(doc(db, "settings", "sync"), { lastSync, updatedAt: Timestamp.now() }, { merge: true });
  } catch (e) {
    console.error("Error updating sync metadata:", e);
  }
};

/**
 * News Persistence & Archival
 */
export const getNewsItemBySlug = async (slug: string): Promise<NewsItem | null> => {
  const cleanSlug = slug.split('?')[0].replace(/\/$/, ''); // Remove query params and trailing slash
  
  if (!db) {
    return MOCK_NEWS.find(n => (n.slug || slugify(n.title)) === cleanSlug) || null;
  }
  try {
    const newsRef = collection(db, "news");
    const q = query(newsRef, where("slug", "==", cleanSlug), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as NewsItem;
    }
    
    // Fallback: check mock news if not found in DB
    return MOCK_NEWS.find(n => (n.slug || slugify(n.title)) === cleanSlug) || null;
  } catch (e) {
    console.error("Error fetching news by slug:", e);
    // Fallback to mock news even on error
    return MOCK_NEWS.find(n => (n.slug || slugify(n.title)) === cleanSlug) || null;
  }
};

export const getCloudNews = async (): Promise<NewsItem[]> => {
  console.log("getCloudNews: Initiating fetch...");
  
  if (!db) {
    console.log("getCloudNews: No DB, returning MOCK_NEWS");
    return MOCK_NEWS;
  }
  
  return new Promise<NewsItem[]>(async (resolve) => {
    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      console.warn("getCloudNews: Timeout reached, falling back to MOCK_NEWS");
      resolve(MOCK_NEWS);
    }, 5000);

    try {
      const newsRef = collection(db, "news");
      // Increased limit to 1000 to support larger archives
      const q = query(newsRef, limit(1000)); 
      console.log("getCloudNews: Executing query...");
      const querySnapshot = await getDocs(q);
      clearTimeout(timeout);
      
      console.log("getCloudNews: Query complete, docs found:", querySnapshot.size);
      const cloudNews: NewsItem[] = [];
      querySnapshot.forEach((doc: any) => {
        cloudNews.push({ id: doc.id, ...doc.data() });
      });
      
      if (cloudNews.length === 0) {
        console.log("getCloudNews: No cloud news in DB, returning MOCK_NEWS");
        resolve(MOCK_NEWS);
      } else {
        // Sort by date string descending
        const sorted = cloudNews.sort((a, b) => {
          try {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } catch (e) { return 0; }
        });
        resolve(sorted);
      }
    } catch (e) {
      clearTimeout(timeout);
      console.error("getCloudNews: Error fetching from cloud:", e);
      resolve(MOCK_NEWS);
    }
  });
};

export const archiveNewsItems = async (items: NewsItem[]) => {
  if (!db) return;
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const ref = doc(collection(db, "news"), item.id);
      const slug = item.slug || slugify(item.title);
      batch.set(ref, { ...item, slug, isLive: true, archivedAt: Timestamp.now() });
    });
    await batch.commit();
  } catch (e) {
    console.error("News Archival Error:", e);
  }
};

export const getPublishedNews = (): NewsItem[] => {
  const stored = localStorage.getItem(NEWS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const publishNewsUpdate = async (news: Omit<NewsItem, 'id'>) => {
  const slug = news.slug || slugify(news.title);
  if (db) {
    const docRef = await addDoc(collection(db, "news"), {
      ...news,
      slug,
      isLive: true,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }
  const current = getPublishedNews();
  const newItem = { ...news, id: Date.now().toString(), slug };
  localStorage.setItem(NEWS_KEY, stringify([newItem, ...current]));
  return newItem.id;
};

export const deleteNewsUpdate = async (id: string) => {
  if (db) {
    await deleteDoc(doc(db, "news", id));
  }
  const current = getPublishedNews();
  localStorage.setItem(NEWS_KEY, stringify(current.filter(n => n.id !== id)));
};

/**
 * Global Forum / Comments Logic
 */
export const fetchNewsComments = async (newsId: string): Promise<Comment[]> => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "comments"), 
      where("newsId", "==", newsId)
    );
    const snapshot = await getDocs(q);
    const comments: Comment[] = [];
    snapshot.forEach((doc: any) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    
    return comments.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (e) {
    console.error("Comment Sync Error:", e);
    return [];
  }
};

export const postNewsComment = async (comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment | null> => {
  if (!db) return null;
  try {
    const commentData = {
      ...comment,
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, "comments"), commentData);
    return { id: docRef.id, ...commentData };
  } catch (e) {
    console.error("Comment Post Error:", e);
    return null;
  }
};

export const deleteNewsComment = async (commentId: string): Promise<boolean> => {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "comments", commentId));
    return true;
  } catch (e) {
    console.error("Comment Deletion Error:", e);
    return false;
  }
};

/**
 * Marketplace / Billboard Logic
 */
export const getCloudAds = async (): Promise<BillboardAd[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "billboard"), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    const ads: BillboardAd[] = [];
    snapshot.forEach((doc: any) => {
      ads.push({ id: doc.id, ...doc.data() });
    });
    
    return ads.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (e) { return []; }
};

export const getPendingAds = async (): Promise<BillboardAd[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "billboard"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    const ads: BillboardAd[] = [];
    snapshot.forEach((doc: any) => {
      ads.push({ id: doc.id, ...doc.data() });
    });
    return ads;
  } catch (e) { return []; }
};

export const submitPendingAd = async (ad: Omit<BillboardAd, 'id'>) => {
  if (!db) return null;
  const docRef = await addDoc(collection(db, "billboard"), {
    ...ad,
    status: 'pending',
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const approveAd = async (id: string) => {
  if (!db) return false;
  const adRef = doc(db, "billboard", id);
  await updateDoc(adRef, { status: 'active', isVerified: true });
  return true;
};

export const publishCloudAd = async (ad: Omit<BillboardAd, 'id'>) => {
  if (!db) return null;
  const docRef = await addDoc(collection(db, "billboard"), {
    ...ad,
    createdAt: Timestamp.now(),
    status: 'active'
  });
  return docRef.id;
};

export const deleteCloudAd = async (id: string) => {
  if (!db) return false;
  await deleteDoc(doc(db, "billboard", id));
  return true;
};

/**
 * COMMUNICATIONS / BROADCAST HUB
 * This logic creates documents for the "Trigger Email from Firestore" extension.
 */
export const dispatchBroadcast = async (data: Omit<BroadcastEmail, 'id' | 'sentAt' | 'recipientCount'>) => {
  if (!db) return false;
  try {
    // 1. Fetch Recipients
    const subscribers = await getSubscribers();
    if (subscribers.length === 0) return false;

    const emails = subscribers.map(s => s.email);

    // 2. Log Broadcast in System
    await addDoc(collection(db, "broadcasts"), {
      ...data,
      sentAt: Timestamp.now(),
      recipientCount: emails.length
    });

    // 3. Trigger Individual Emails (Firestore Trigger Email Extension Format)
    const batch = writeBatch(db);
    emails.forEach(email => {
      const emailRef = doc(collection(db, "mail"));
      batch.set(emailRef, {
        to: email,
        message: {
          subject: data.subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <div style="background: #1e3a8a; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">CampusAI.ng</h1>
                <p style="color: #60a5fa; margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">2026 Admission Intelligence</p>
              </div>
              <div style="padding: 40px;">
                <h2 style="color: #111827; margin-top: 0;">${data.headline}</h2>
                <div style="color: #4b5563; line-height: 1.6; font-size: 16px;">
                  ${data.body.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 40px; text-align: center;">
                  <a href="${data.ctaLink}" style="background: #2563eb; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                    ${data.ctaText}
                  </a>
                </div>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #9ca3af; font-size: 10px; margin: 0;">You received this because you are subscribed to CampusAI 2026 alerts.</p>
                <p style="color: #9ca3af; font-size: 10px; margin: 5px 0 0 0;">&copy; 2026 CampusAI.ng. Lagos, Nigeria.</p>
              </div>
            </div>
          `
        }
      });
    });

    await batch.commit();
    return true;
  } catch (e) {
    console.error("Broadcast Dispatch Error:", e);
    return false;
  }
};

/**
 * Subscriber Sync
 */
export const subscribeEmail = async (email: string) => {
  if (!db) return true; // Mock success
  try {
    await setDoc(doc(db, "subscribers", email.replace(/\./g, '_')), {
      email,
      subscribedAt: Timestamp.now()
    });
    return true;
  } catch (e) { return false; }
};

export const getSubscribers = async () => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, "subscribers"));
    const subs: any[] = [];
    snapshot.forEach((doc: any) => subs.push({ id: doc.id, ...doc.data() }));
    return subs;
  } catch (e) { return []; }
};

/**
 * Institutional Data Cache
 */
export const getGlobalScoringSystem = async (slug: string) => {
  if (!db) return null;
  const snap = await getDoc(doc(db, "institutional_logic", slug));
  return snap.exists() ? snap.data() : null;
};

export const saveGlobalScoringSystem = async (slug: string, data: any) => {
  if (!db) return;
  await setDoc(doc(db, "institutional_logic", slug), data);
};

/**
 * Global Configuration Persistence
 */
export const getGlobalConfig = async (): Promise<any> => {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "settings", "global"));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Error fetching global config:", e);
    return null;
  }
};

export const saveGlobalConfig = async (config: any) => {
  if (!db) return;
  try {
    await setDoc(doc(db, "settings", "global"), {
      ...config,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (e) {
    console.error("Error saving global config:", e);
  }
};

/**
 * ASUU Strike Status Logic
 */
export const getASUUStatusFromDB = async (): Promise<{ isActive: boolean, status: string, summary: string, lastUpdated: string } | null> => {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "settings", "asuu"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        isActive: data.isActive,
        status: data.status,
        summary: data.summary,
        lastUpdated: data.updatedAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const saveASUUStatusToDB = async (data: { isActive: boolean, status: string, summary: string }) => {
  if (!db) return;
  await setDoc(doc(db, "settings", "asuu"), {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const saveFeedback = async (data: { feedback: string; rating: number; userId?: string; email?: string }) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "feedback"), {
      ...data,
      timestamp: Timestamp.now()
    });
  } catch (e) {
    console.error("Error saving feedback:", e);
    throw e;
  }
};

/**
 * Premium Subscriptions
 */
export const savePremiumSubscription = async (data: { email: string; paymentTimestamp: any; tx_ref: string }) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "premium_subscriptions"), {
      ...data,
      createdAt: Timestamp.now()
    });
  } catch (e) {
    console.error("Error saving subscription:", e);
    throw e;
  }
};

/**
 * Chat Logging
 */
export const logChatSession = async (uid: string, messages: ChatMessage[]) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "chats"), {
      uid,
      messages,
      timestamp: Timestamp.now()
    });
  } catch (e) {
    console.error("Chat Logging Error:", e);
  }
};

/**
 * PERSISTENT CHAT HISTORY
 */
export const saveChatHistory = async (userId: string, messages: ChatMessage[]) => {
  if (!db) return;
  try {
    // Save last 20 messages
    const last20 = messages.slice(-20);
    await setDoc(doc(db, 'users', userId, 'chatHistory', 'data'), { messages: last20, updatedAt: Timestamp.now() }, { merge: true });
  } catch (e) {
    console.error("Error saving chat history:", e);
  }
};

export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  if (!db) return [];
  try {
    const docRef = doc(db, 'users', userId, 'chatHistory', 'data');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().messages : [];
  } catch (e) {
    console.error("Error fetching chat history:", e);
    return [];
  }
};
