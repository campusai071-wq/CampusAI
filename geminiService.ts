import { GoogleGenAI } from "@google/genai";
import { NewsItem } from "../types";
import { getCachedAnswer, saveToCache } from "./cacheService";
import { searchWeb } from "./searchService";
import { getReverseGeocoding } from "./maptilerService";

let genAI: GoogleGenAI | null = null;
let serverAIInstance: any = null;

export const setServerAIInstance = (instance: any) => {
  serverAIInstance = instance;
};

const getGenAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('campusai_gemini_key') : undefined);
    if (!key) {
      if (typeof window !== 'undefined') {
        return null;
      }
      // If we have a server instance set from server.ts, we don't need a key
      if (serverAIInstance) return null;
      throw new Error("GEMINI_API_KEY or GCP_PROJECT_ID is missing.");
    }
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

export const getAIInstance = (feature: string): any => {
  if (typeof window !== 'undefined') {
    return {
      models: {
        generateContent: async (params: any) => {
          const response = await fetch('/api/ai/generateContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params, feature })
          });
          if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || "AI Proxy Request failed");
          }
          const data = await response.json();
          return {
            text: data.text,
            get response() {
               return { text: () => data.text };
            }
          };
        },
        generateContentStream: async function* (params: any) {
          const response = await fetch('/api/ai/chat-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: params.contents[params.contents.length - 1].parts[0].text, 
              history: params.contents.slice(0, -1).map((c: any) => ({ role: c.role, text: c.parts[0].text })) 
            })
          });
          
          if (!response.ok) throw new Error("Stream proxy failed");
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No reader");
          
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const chunk = JSON.parse(line.slice(6));
                yield { text: chunk.text };
              }
            }
          }
        }
      }
    };
  }

  // Server-side
  if (serverAIInstance) {
    return serverAIInstance;
  }

  return getGenAI();
};

// ... (Other functions will follow)

const SYSTEM_STRATEGIST_PROMPT = `You are the CampusAI Strategist v6.2, Nigeria's most authoritative Admission & Academic Intelligence Engine for the 2026/2027 academic session.

VERIFIED 2026 JAMB DATA:
- UTME held: April 16–25, 2026 across 966 accredited CBT centres nationwide.
- Total candidates: 2,243,816 — the largest in JAMB's 48-year history.
- Results released in batches from April 17, 2026 onwards.
- Result check method: SMS "UTMERESULT" to 55019 or 66019 (use the SIM used for registration, ₦100 airtime required).
- Minimum JAMB cutoff: 140 for federal universities, 120 for state and private universities.

UNIVERSITY SCORING FORMULAS (CONFIRMED):
- UNILAG, FUTMINNA: JAMB(50%) + Post-UTME(30%) + O-Level(20%) = 100
- UI, OAU, ABU, UNN, UNILORIN, UNIBEN, UNIPORT: JAMB(50%) + Post-UTME(50%) = 100
- FUTA, LASU: Point-based — (JAMB score ÷ 8) + O-Level grade points
- For any university NOT listed above: Search Google to confirm their formula before answering.

LIFECYCLE CONTEXTS:
- Pre-Admission: JAMB scores, cutoffs, Post-UTME dates, registration, CBT centres.
- In-Campus: CGPA calculations, departmental news, course advice, academic support.
- Graduate/Alumni: NYSC mobilization, job openings, CV, postgraduate options.
- Institutions: NUC accreditation, policy updates, admin logic.

DIRECTIVES:
1. Always give specific numbers, percentages, and named institutions — never vague answers.
2. Reference 2023, 2024, and 2025 historical cutoffs when predicting 2026 admission chances.
3. If a university is not in your training data, search Google before answering — do not guess.
4. Always suggest 3 alternative universities or courses when a student's score is borderline or low.
5. Label answers as "Confirmed" if sourced online, or "Estimated" if inferred from patterns.
6. Keep responses concise and scholar-focused. Lead with the most important information.`;

/**
 * TASK 1: CONVERSATIONAL INTELLIGENCE (STREAMING)
 */
export async function* streamGeminiChat(
  message: string,
  history: { role: 'user' | 'model', text: string }[] = [],
  attachment?: { data: string, mimeType: string },
  useSearch: boolean = false,
  userRole: string = 'Pre-Admission',
  university?: string,
  targetCourse?: string
) {
  // Check cache first if not using search or attachments
  if (!useSearch && !attachment && history.length === 0) {
    const cached = await getCachedAnswer(message);
    if (cached) {
      yield { text: cached };
      return;
    }
  }

  try {
    const ai = getAIInstance('chat');
    
    // ...
    // VertexAI API call structure is different:
    // model.generateContentStream({ contents: [...] })
    
    const parts: any[] = attachment 
      ? [{ inlineData: { data: attachment.data, mimeType: attachment.mimeType } }, { text: message }] 
      : [{ text: message }];

    const config: any = { 
      systemInstruction: `${SYSTEM_STRATEGIST_PROMPT}\n\nCURRENT USER CONTEXT: ${userRole}${university ? `\nUniversity: ${university}` : ''}${targetCourse ? `\nTarget Course: ${targetCourse}` : ''}\n\nIf this question is about a university not in your training data, use Google Search to find their scoring formula, cutoffs, and courses before answering. Never guess for unknown institutions.`,
      temperature: 0.75,
      topP: 0.9,
      tools: useSearch && !attachment ? [{ googleSearch: {} }] : [],
    };
    
    let finalMessage = message;
    
    const formattedHistory = history.map(h => ({ 
      role: h.role === 'user' ? 'user' : 'model', 
      parts: [{ text: h.text }] 
    }));

    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [...formattedHistory, { role: 'user', parts: parts }],
      config: config,
    });
    
    let fullResponse = '';
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        yield { 
          text: text, 
          groundingChunks: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks 
        };
      }
    }

    // Save to cache if not using search or attachments
    if (!useSearch && !attachment && history.length === 0) {
      await saveToCache(message, fullResponse);
    }
  } catch (e: any) {
    console.error("AI Logic Node failure:", e);
    yield { text: "🔄 Routing through secondary logic cluster... Connection unstable.", groundingChunks: [] };
  }
}

/**
 * TASK 2: 2026 NEWS DISPATCHER (Weighted Scraper)
 */
export const fetchLiveNews = async (categories?: string[]): Promise<NewsItem[]> => {
  let retries = 3;
  let delayMs = 2000;

  while (retries > 0) {
    try {
      const ai = getAIInstance('news');
      const now = new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();
      const prevMonth = monthNames[now.getMonth() === 0 ? 11 : now.getMonth() - 1];
      
      console.log(`AI Strategist: Initiating News Fetch Cycle for ${prevMonth}-${currentMonth} ${currentYear}... (Attempt ${4-retries}/3)`);

      const prompt = `Search Google for the most recent Nigerian university and education news from ${prevMonth}–${currentMonth} ${currentYear}.

PRIORITY TOPICS (search each one):
1. JAMB ${currentYear} UTME results, cutoff marks, and admission lists — any university
2. Post-UTME registration dates — cover both popular and lesser-known state universities
3. ASUU strike updates, warnings, or resumption news
4. NUC accreditation approvals, withdrawals, or new policy directives
5. Federal university news — resumption dates, tuition, senate decisions (UNILAG, UI, OAU, ABU, UNN, UNIBEN, UNIPORT, FUTA, FUNAAB, UNILORIN)
6. State university news — LASU, LASPOTECH, MAPOLY, AAUA, EKSU, FUWUKARI, ABSU, COOU, IMSU, RSUST, etc.
7. Private university news — Covenant, Babcock, Landmark, Redeemer's, Pan-Atlantic, etc.
8. NYSC ${currentYear} mobilization stream dates and updates
9. Active Nigerian scholarships with upcoming deadlines
10. Graduate job openings relevant to Nigerian degree holders

Return exactly 12 diverse news items. Each must have a real, verifiable source URL. Spread coverage — do not repeat universities or categories. Automatically generate 4-6 relevant tags per news article (including university name, category, topic, and year).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });
      
      const responseText = response.text;
      if (!responseText) {
        console.warn("AI Strategist: Empty response from Logic Node.");
        return [];
      }
      
      const data = JSON.parse(responseText);
      const news = (data.news || []).map((item: any) => ({
        ...item,
        id: item.id && item.id.length > 5 ? item.id : `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        image: item.image || `https://picsum.photos/seed/${encodeURIComponent(item.title)}/800/450`
      }));
      console.log(`AI Strategist: Successfully retrieved ${news.length} news items.`);
      return news;
    } catch (e: any) {
      let isRateLimit = false;
      try {
        const errorBody = typeof e.message === 'string' ? JSON.parse(e.message) : e;
        if (errorBody?.error?.code === 429) isRateLimit = true;
      } catch {}

      if (isRateLimit && retries > 1) {
        console.warn(`AI Strategist: Quota exhausted (429), retrying in ${delayMs}ms... (Remaining: ${retries - 1})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        retries--;
        delayMs *= 2;
      } else {
        if (isRateLimit) {
          console.error("AI Strategist: News Critical quota failure (429) after all retries.");
        } else {
          console.error("AI Strategist: News Fetch Failure:", e);
        }
        return [];
      }
    }
  }
  return [];
};

/**
 * TASK 8: VIDEO CONTENT ARCHITECT
 */
export const generateNewsVideoScript = async (news: NewsItem) => {
  try {
    const ai = getAIInstance('video');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `When generating TikTok video scripts for CampusAI.ng, write in a casual conversational tone like a Nigerian student talking to their friend. Start with a hook that creates urgency or curiosity in the first 3 seconds. Use simple everyday language — no formal words. Always mention campusai-ng.vercel.app naturally in the middle of the script not at the end. End with a reason to follow — either a follow-up update coming or a question that makes them comment. Keep the full script under 45 seconds when spoken aloud.
      
      Based on this article:
      Article Title: "${news.title}"
      Article Content: "${news.excerpt || news.title}"
      
      Output MUST be valid JSON (no markdown formatting).
      Include:
      1. script: A full video script (spoken words)
      2. voiceoverText: The concise voiceover dialogue
      3. visualCues: Array of 5 string descriptions for background visuals
      4. hashtags: Array of 5 string hashtags
      5. suggestedTitle: One catchy video title` }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(responseText);
  } catch (e) {
    console.error("Video Script Generation Error:", e);
    throw e; // Rethrow so the UI can catch and handle
  }
};

import { getUniversityFromDB } from "../src/data/universityData";

/**
 * TASK 3: INSTITUTIONAL BIOGRAPHER
 */
export const getUniversityDetailedInfo = async (name: string) => {
  // Check local DB first
  const dbInfo = getUniversityFromDB(name);
  if (dbInfo) {
    return {
      bio: dbInfo.bestKnownFor,
      founded: dbInfo.founded,
      motto: dbInfo.motto,
      bestKnownFor: dbInfo.bestKnownFor,
      campusVibe: dbInfo.campusVibe,
      facultyStudentRatio: dbInfo.facultyStudentRatio,
      researchOutput: dbInfo.researchOutput,
      facilities: dbInfo.facilities,
    };
  }

  try {
    const ai = getAIInstance('bio');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Search Google for a 2026 academic profile of ${name}, Nigeria.
[...]
Keep the bio under 120 words — clear, accurate, and student-friendly.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{}');
  } catch (e) {
    return null;
  }
};

/**
 * TASK 4: COURSE ARCHITECT
 */
export const getUniversityCourses = async (university: string) => {
  // Check local DB first
  const dbInfo = getUniversityFromDB(university);
  if (dbInfo && dbInfo.courses.length > 0) {
    return dbInfo.courses;
  }

  try {
    const ai = getAIInstance('courses');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Search Google for all accredited undergraduate courses at ${university}, Nigeria for the 2026/2027 academic session.
[...]
Do not include courses that are suspended, unaccredited, or not yet approved by NUC.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{"courses":[]}').courses || [];
  } catch (e) {
    return [];
  }
};

/**
 * TASK 5: ADMISSION AUDITOR
 */
export const getCourseCutoffInfo = async (university: string, course: string, score: number, oLevels: string, userRole?: string) => {
  try {
    const ai = getAIInstance('cutoff');
    const roleInfo = userRole ? `\n- User Role: ${userRole}` : '';
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `You are an Admission Analyzer and Strategist for a Nigerian student acting on behalf of CampusAI.ng. Use Google Search to verify all data.
[...]
8. If ${university} is not widely known, search Google first before answering — never guess their formula.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{}');
  } catch (e) {
    return null;
  }
};

/**
 * TASK 6: LOGIC KERNEL (SCORING)
 */
export const getUniversityScoringSystem = async (university: string) => {
  // Check local DB first
  const dbInfo = getUniversityFromDB(university);
  if (dbInfo) {
    return dbInfo.scoringSystem;
  }

  try {
    const ai = getAIInstance('scoring');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Search Google to find the exact 2026 aggregate scoring formula for ${university}, Nigeria.
[...]
Label answer "Confirmed" if sourced online, or "Estimated" if inferred. Explain in plain English so students understand.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{}');
  } catch (e) {
    return null;
  }
}

/**
 * TASK 9: POST-UTME TRACKER
 */
export const getPostUtmeDates = async (university: string) => {
  try {
    const ai = getAIInstance('tracker');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Search Google for the 2026 Post-UTME registration details for ${university}, Nigeria.
[...]
Label answer as "Released", "Pending", or "Estimated" based on what you find.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{}');
  } catch (e) {
    return null;
  }
};

import { getASUUStatusFromDB } from "./dbService";

/**
 * TASK 10: ASUU STRIKE MONITOR
 */
export const getAsuuStrikeStatus = async () => {
  // Check DB first
  const dbStatus = await getASUUStatusFromDB();
  if (dbStatus) {
    return dbStatus;
  }

  try {
    const ai = getAIInstance('strike');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Search Google for the current ASUU strike status in Nigeria as of ${new Date().toLocaleDateString('en-NG', {month: 'long', year: 'numeric'})}.
[...]
Keep the summary under 60 words — direct and factual.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{}');
  } catch (e) {
    return { isActive: false, status: "Stable", lastUpdated: new Date().toLocaleDateString(), summary: "No active strike reported." };
  }
};

/**
 * TASK 11: SCHOLARSHIP SCOUT
 */
export const getScholarships = async (category: string) => {
  try {
    const ai = getAIInstance('scholarship');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Search Google for active scholarships available to ${category} students in Nigeria in 2026.
[...]
Only return scholarships with real application links — do not fabricate URLs.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{"scholarships":[]}').scholarships || [];
  } catch (e) {
    return [];
  }
};

/**
 * TASK 12: JOB OPENING SCOUT
 */
export const getJobOpenings = async (field: string) => {
  try {
    const ai = getAIInstance('jobs');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Search Google for current job openings in Nigeria relevant to ${field} graduates in 2026.
[...]
Find 5 real job openings. Include opportunities from Nigerian companies, multinationals operating in Nigeria, NGOs, and government agencies. Only return jobs with real application links — do not fabricate URLs or company names.` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const responseText = response.text;
    return JSON.parse(responseText || '{"jobs":[]}').jobs || [];
  } catch (e) {
    return [];
  }
};

/**
 * TASK 7: GEO-LOCATOR
 */

export async function* streamMapsChat(
  message: string,
  userCoords: { lat: number; lng: number },
  history: { role: 'user' | 'model', text: string }[] = []
) {
  try {
    const ai = getAIInstance('maps');
    const formattedHistory = history.map(h => ({ 
      role: h.role === 'user' ? 'user' : 'model', 
      parts: [{ text: h.text }] 
    }));
    
    // Get location context from MapTiler
    const locationContext = await getReverseGeocoding(userCoords.lat, userCoords.lng);
    const enhancedMessage = `Context: The user is currently at or near ${locationContext}. \n\nUser Question: ${message}`;
    
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [...formattedHistory, { role: 'user', parts: [{ text: enhancedMessage }] }],
    });
    
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield { 
          text: text, 
          groundingChunks: [] 
        };
      }
    }
  } catch (e: any) {
    yield { text: "🌍 Geo-Logic signal weak. Please check GPS permissions.", groundingChunks: [] };
  }
}

/**
 * TASK 13: MORNING BRIEFING ENGINE
 * Compiles daily admission updates into ready-to-post channel messages
 */
export const generateMorningBriefing = async (): Promise<{
  summary: string;
  updates: { category: string; headline: string; detail: string; readyToPost: string; tags: string[] }[];
  whatsappFreePost: string;
  whatsappPremiumPost: string;
  telegramFreePost: string;
  telegramPremiumPost: string;
  date: string;
}> => {
  const ai = getAIInstance('news');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `You are compiling a daily Nigerian university admission intelligence briefing for ${dateStr}.
[...]
4. Premium Telegram version: full detailed breakdown, includes predictions, university specific details, personal tips, what's coming this week, ends with invite to send personal score for analysis, ending with campusai-ng.vercel.app.` }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
    },
  });

  const responseText = response.text;
  const data = JSON.parse(responseText || '{}');
  return { ...data, date: dateStr };
};

export const findCBTCenters = async (lat: number, lng: number): Promise<{title: string, uri: string}[]> => {
  const location = await getReverseGeocoding(lat, lng);
  
  try {
    const ai = getAIInstance('maps');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `List 3 accredited JAMB CBT registration centres near ${location}. Return the result as a JSON array of objects, each with 'title' and 'uri' (a Google Maps search URL).` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    
    const responseText = response.text;
    return JSON.parse(responseText || '[]');
  } catch (error) {
    console.error("AI CBT Finder error:", error);
    return [];
  }
};