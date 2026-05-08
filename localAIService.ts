
import { NewsItem, UniversityCategory } from "../types";

/**
 * CampusAI Sovereign AI Bridge
 * Engine: Ollama (Local Inference)
 * Model: llama3.2:1b
 */

let ACTIVE_OLLAMA_BASE = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2:1b";

const POSSIBLE_HOSTS = [
  "http://127.0.0.1:11434",
  "http://localhost:11434"
];

export const pingLocalNode = async () => {
  for (const host of POSSIBLE_HOSTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${host}/api/tags`, { 
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        ACTIVE_OLLAMA_BASE = host;
        return true;
      }
    } catch (e) {
      // Continue to next host
    }
  }
  return false;
};

export const verifyModelExists = async () => {
  try {
    const res = await fetch(`${ACTIVE_OLLAMA_BASE}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.models?.some((m: any) => m.name.includes(DEFAULT_MODEL)) || false;
  } catch {
    return false;
  }
};

/**
 * New Streaming Function for faster perceived performance
 */
export async function* streamMessageToOllama(
  message: string,
  history: { role: 'user' | 'model', text: string }[] = []
) {
  const messages = [
    { 
      role: "system", 
      content: "You are CampusAI, a specialized Nigerian Higher Education assistant. Provide updates on JAMB and admission requirements. Be concise." 
    },
    ...history.map(h => ({ 
      role: h.role === 'model' ? 'assistant' : 'user', 
      content: h.text 
    })),
    { role: "user", content: message }
  ];

  const response = await fetch(`${ACTIVE_OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    try {
      // Ollama sends multiple JSON objects in one chunk sometimes
      const jsonLines = chunk.split('\n').filter(l => l.trim());
      for (const line of jsonLines) {
        const data = JSON.parse(line);
        if (data.message?.content) {
          yield data.message.content;
        }
        if (data.done) return;
      }
    } catch (e) {
      console.warn("Error parsing chunk", e);
    }
  }
}

// Legacy non-streaming call for structured data tasks
async function callOllama(messages: any[], isJson = false) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${ACTIVE_OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        stream: false,
        format: isJson ? "json" : undefined,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) throw new Error("MODEL_NOT_FOUND");
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error("OLLAMA_TIMEOUT");
    throw error;
  }
}

export const sendMessageToOllama = async (
  message: string,
  history: { role: 'user' | 'model', text: string }[] = []
) => {
  const text = await callOllama([
    { role: "system", content: "You are CampusAI." },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
    { role: "user", content: message }
  ]);
  return { text, groundingChunks: [] };
};

export const getUniversityDetailedInfo = async (name: string) => {
  const prompt = `Provide detailed academic profile for ${name} in Nigeria. Return ONLY a JSON object with: bio, founded, motto, bestKnownFor, campusVibe, facultyStudentRatio, researchOutput, facilities (array of strings).`;
  try {
    const response = await callOllama([{ role: "user", content: prompt }], true);
    return JSON.parse(response);
  } catch (e) { return null; }
};

export const getUniversityCourses = async (university: string) => {
  const prompt = `List 5 major courses at ${university}. Return ONLY a JSON object: {"courses": ["A", "B"]}`;
  try {
    const response = await callOllama([{ role: "user", content: prompt }], true);
    return JSON.parse(response).courses || [];
  } catch (e) { return []; }
};

export const getUniversityFees = async (university: string) => {
  const prompt = `Provide estimated 2026/2027 tuition and acceptance fees for ${university}. Return ONLY a JSON object: {"tuition": "string", "acceptance": "string", "other": "string", "total": "string"}`;
  try {
    const response = await callOllama([{ role: "user", content: prompt }], true);
    return JSON.parse(response);
  } catch (e) { return null; }
};

export const getCourseCutoffInfo = async (university: string, course: string) => {
  const prompt = `Provide cutoff for ${course} at ${university}. Return ONLY a JSON object: {"cutoff": "string", "subjectCombination": "string", "recommendation": "string", "reliability": "string"}`;
  try {
    const response = await callOllama([{ role: "user", content: prompt }], true);
    return JSON.parse(response);
  } catch (e) { return null; }
};

export const fetchLiveNews = async (): Promise<NewsItem[]> => {
  const prompt = `Generate 4 JAMB 2026 news items. Return ONLY a JSON object with a "news" array.`;
  try {
    const response = await callOllama([{ role: "user", content: prompt }], true);
    return JSON.parse(response).news || [];
  } catch (error) { return []; }
};
