import { getAIInstance } from "./geminiService";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const summarizeNews = async (content: string, task: string = 'NEWS'): Promise<{ summary: string, related: { title: string, url: string }[] }> => {
  const ai = getAIInstance('news');
  let retries = 5;
  let delayMs = 3000;

  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Summarize the following news article in detail, providing a comprehensive overview. Also, suggest 3 related news topics or articles that would be relevant to this story. For each, provide a title and a URL: ${content}`}] }],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });
      const responseText = response.text;
      if (!responseText) throw new Error("Empty response");
      const data = JSON.parse(responseText);
      return data;
    } catch (e: any) {
      let isRateLimit = false;
      try {
        const errorBody = typeof e.message === 'string' ? JSON.parse(e.message) : e;
        if (errorBody?.error?.code === 429) isRateLimit = true;
      } catch {}

      if (isRateLimit && retries > 1) {
        console.warn(`Quota exhausted for summarization, retrying in ${delayMs}ms... (Remaining: ${retries-1})`);
        await delay(delayMs);
        retries--;
        delayMs *= 2;
      } else {
        console.error("Summarization error:", e);
        return { summary: content, related: [] };
      }
    }
  }
  return { summary: content, related: [] };
};

export const getAsuuStatus = async (): Promise<string> => {
  const ai = getAIInstance('strike');
  let retries = 3;
  let delayMs = 1000;

  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: 'Provide the current ASUU strike status in Nigeria in 2 words or less.'}] }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      return response.text || 'Status unavailable';
    } catch (e: any) {
      let isRateLimit = false;
      try {
        const errorBody = typeof e.message === 'string' ? JSON.parse(e.message) : e;
        if (errorBody?.error?.code === 429) isRateLimit = true;
      } catch {}

      if (isRateLimit && retries > 1) {
        console.warn(`Quota exhausted for strike, retrying in ${delayMs}ms...`);
        await delay(delayMs);
        retries--;
        delayMs *= 2;
      } else {
        console.error("ASUU status error:", e);
        return 'Status unavailable';
      }
    }
  }
  return 'Status unavailable';
};
