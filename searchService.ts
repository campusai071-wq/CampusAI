import { TavilyClient } from "tavily";
import axios from 'axios';

let tvly: TavilyClient | null = null;

const getTvly = () => {
  if (!tvly && process.env.TAVILY_API_KEY) {
    tvly = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });
  }
  return tvly;
};

export const searchWeb = async (query: string): Promise<string> => {
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!response.ok) throw new Error("Search proxy failed");
      return await response.json();
    } catch (e) {
      console.error("Search proxy failed, fallback to local error:", e);
      return "Search unavailable.";
    }
  }

  const client = getTvly();
  
  if (client) {
    try {
      // Try Tavily first
      const response = await client.search({ query, search_depth: "advanced" });
      return response.results.map((r: any) => `${r.title}: ${r.content}`).join('\n\n');
    } catch (e) {
      console.error("Tavily search failed, trying Serper:", e);
    }
  }
  
  // Fallback to Serper
  try {
    const response = await axios.post('https://google.serper.dev/search', { q: query }, {
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY }
    });
    return response.data.organic.map((r: any) => `${r.title}: ${r.snippet}`).join('\n\n');
  } catch (e2) {
    console.error("Serper search failed:", e2);
    return "Search unavailable.";
  }
};
