import { getAIInstance } from "./geminiService";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export const polishEssay = async (essay: string) => {
  if (!OPENROUTER_API_KEY) return { polishedEssay: essay, changesMade: "API Key missing" };
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1',
        messages: [
          { role: 'system', content: 'Polish the following academic essay for grammar, tone, and clarity. Maintain the original meaning. Return JSON with polishedEssay and changesMade.' },
          { role: 'user', content: essay }
        ],
      }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    console.error("Essay Polisher Error:", e);
    return null;
  }
};

export const generateProjectTopic = async (department: string) => {
  try {
    const ai = getAIInstance('brain'); // Using Brain/Director key
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Generate 5 unique, researchable project topics for a student in ${department}.` }] }],
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || '{"topics":[]}').topics;
  } catch (e) {
    console.error("Topic Generator Error:", e);
    return [];
  }
};

export const researchAssistant = async (topic: string, pages: number) => {
  const totalPages = Math.min(Math.max(pages, 1), 10);
  const results: any[] = [];
  
  for (let i = 1; i <= totalPages; i++) {
    try {
      const ai = getAIInstance('research'); // Dedicated key
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Write page ${i} of ${totalPages} for an academic research paper on the topic: ${topic}. Ensure the content is structured appropriately for an academic paper.` }] }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      results.push({ page: i, content: response.text });
    } catch (e) {
      results.push({ page: i, content: `Error generating page ${i}.` });
    }
  }
  return results;
};

export const analyzeCGPA = async (cgpa: number, semester: string, userRole?: string, targetUniversity?: string, targetCourse?: string) => {
  try {
    const ai = getAIInstance('scoring');
    const roleInfo = userRole ? `\nUser Role: ${userRole}` : '';
    const targetUniInfo = targetUniversity ? `\nTarget University: ${targetUniversity}` : '';
    const targetCourseInfo = targetCourse ? `\nTarget Course: ${targetCourse}` : '';
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Analyze a CGPA of ${cgpa} for semester ${semester}. Provide advice on how to improve or maintain it.${roleInfo}${targetUniInfo}${targetCourseInfo} Provide context-aware and personalized feedback based on their progression stage if role/targets are provided.` }] }],
    });
    return response.text;
  } catch (e) {
    console.error("CGPA Analysis Error:", e);
    return "Analysis unavailable.";
  }
};
